use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use axum_extra::routing::SpaRouter;
use glob::glob;
// use axum_typed_websockets::{Message, WebSocket, WebSocketUpgrade}
use dashmap::DashMap;
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::fs;
use std::{net::SocketAddr, sync::Arc};
use tokio::sync::broadcast;
use uuid::Uuid;

type ClockId = Uuid;
type PlayerId = Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
struct Clock {
    task: String,
    slices: u8,
    progress: u8,
}

impl Clock {
    fn new(task: String, slices: u8) -> Self {
        Clock {
            task,
            slices,
            progress: 0,
        }
    }

    fn increment(&mut self) {
        self.progress = u8::min(self.progress + 1, self.slices);
    }

    fn decrement(&mut self) {
        self.progress = u8::checked_sub(self.progress, 1).unwrap_or(0);
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct PlayerData {
    name: String,
    clocks: DashMap<ClockId, Clock>,
}

impl PlayerData {
    fn new(name: String) -> Self {
        PlayerData {
            name,
            clocks: DashMap::new(),
        }
    }

    fn add_clock(&mut self, task: String, slices: u8) -> ClockId {
        let id = Uuid::now_v7();
        self.clocks.insert(id, Clock::new(task, slices));
        id
    }

    fn delete_clock(&mut self, id: ClockId) {
        self.clocks.remove(&id);
    }

    fn rename(&mut self, name: String) -> String {
        std::mem::replace(&mut self.name, name)
    }
}

#[derive(Clone, Debug)]
struct Bitd {
    players: Arc<DashMap<PlayerId, PlayerData>>,
}

impl Bitd {
    fn add_player(&mut self, name: String) -> Uuid {
        let player_id = Uuid::now_v7();
        self.players.insert(player_id, PlayerData::new(name));
        player_id
    }

    /// Rename a player and return the old name if successful
    fn rename_player(&mut self, player_id: PlayerId, name: String) -> Option<String> {
        self.players.get_mut(&player_id).map(|mut p| p.rename(name))
    }

    fn remove_player(&mut self, player_id: PlayerId) {
        self.players.remove(&player_id);
        if fs::remove_file(format!("./players/{}.toml", player_id)).is_err() {
            println!("Failed to remove user file: {}", player_id)
        };
    }

    fn add_clock(&self, player_id: PlayerId, task: String, slices: u8) -> ClockId {
        self.players
            .get_mut(&player_id)
            .unwrap()
            .add_clock(task, slices)
    }

    fn delete_clock(&self, player_id: PlayerId, clock_id: ClockId) {
        self.players
            .get_mut(&player_id)
            .unwrap()
            .delete_clock(clock_id);
    }

    fn increment_clock(&self, player_id: PlayerId, clock_id: ClockId) {
        let player = self.players.get_mut(&player_id).unwrap();
        player.clocks.get_mut(&clock_id).unwrap().increment();
    }

    fn decrement_clock(&self, player_id: PlayerId, clock_id: ClockId) {
        let player = self.players.get_mut(&player_id).unwrap();
        player.clocks.get_mut(&clock_id).unwrap().decrement();
    }

    fn backup_player(&self, player_id: PlayerId) {
        if fs::write(
            format!("./players/{}.toml", player_id),
            toml::to_string_pretty(&*self.players.get(&player_id).unwrap()).unwrap(),
        )
        .is_err()
        {
            println!("Failed to backup player {}", player_id);
        };
    }
}

// Our shared state
struct AppState {
    bitd: Bitd,
    // Channel used to send messages to all connected clients.
    tx: broadcast::Sender<SyncRequest>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
enum Instruction {
    /// Sent to the server by the client to request a change to state.
    FullSync,
    AddClock(PlayerId, String, u8),
    DeleteClock(PlayerId, ClockId),
    IncrementClock(PlayerId, ClockId),
    DecrementClock(PlayerId, ClockId),
    AddPlayer(String),
    RenamePlayer(PlayerId, String),
    RemovePlayer(PlayerId),
}

#[derive(Serialize, Debug, Clone)]
enum SyncRequest {
    /// Messages broadcast to the send task to trigger a state update to any websocket clients
    Full,
    Clock(PlayerId, ClockId),
    DeleteClock(PlayerId, ClockId),
    AddPlayer(PlayerId),
    RenamePlayer(PlayerId),
    RemovePlayer(PlayerId),
}

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type")]
enum UpdatePacket<'a> {
    /// Pieces of state sent from the server to the client after a change.
    Full(&'a DashMap<PlayerId, PlayerData>),
    Clock {
        player_id: PlayerId,
        clock_id: ClockId,
        clock: &'a Clock,
    },
    DeleteClock {
        player_id: PlayerId,
        clock_id: ClockId,
    },
    Player {
        player_id: PlayerId,
        player_data: &'a PlayerData,
    },
    PlayerName {
        player_id: PlayerId,
        player_name: &'a str,
    },
    RemovePlayer {
        player_id: PlayerId,
    },
}

#[tokio::main]
async fn main() {
    // use this to preview json reprs of newly defined types
    // dbg!(serde_json::to_string(&Instruction::RemovePlayer(Uuid::now_v7())).unwrap());

    // Load players from backup
    let players = DashMap::new();
    fs::create_dir_all("./players").expect("Could not create server/players/ directory.");

    for path in glob("./players/*.toml")
        .expect("Failed to read glob pattern.")
        .filter_map(Result::ok)
    {
        if let (Some(stem), Ok(contents)) = (
            path.file_stem().unwrap().to_str(), // unwrap is safe bc we know path matches *.toml
            &fs::read_to_string(&path),
        ) {
            if let Ok(uuid) = Uuid::try_parse(stem) {
                if let Ok(player) = toml::from_str(contents) {
                    players.insert(uuid, player);
                }
            }
        }
    }

    let bitd = Bitd {
        players: Arc::new(players),
    };

    // Set up application state for use with with_state().
    let (tx, _rx) = broadcast::channel(100);
    let shared_state = Arc::new(AppState { bitd, tx });

    let spa = SpaRouter::new("", "../client");
    let app = Router::new()
        .merge(spa)
        .route("/ws", get(websocket_handler))
        .with_state(shared_state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::debug!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| websocket(socket, state))
}

// This function deals with a single websocket connection, i.e., a single
// connected client / user, for which we will spawn two independent tasks (for
// receiving / sending chat messages).
async fn websocket(stream: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = stream.split();
    let mut rx = state.tx.subscribe();

    let bitd = state.bitd.clone();

    // Spawn the first task that will receive broadcast messages and send text
    // messages over the websocket to our client.
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            match msg {
                SyncRequest::Full => {
                    if sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::Full(&bitd.players)).unwrap(),
                        ))
                        .await
                        .is_err()
                    {
                        break;
                    };
                }
                SyncRequest::Clock(player_id, clock_id) => {
                    if sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::Clock {
                                player_id,
                                clock_id,
                                clock: &bitd
                                    .players
                                    .get(&player_id)
                                    .unwrap()
                                    .clocks
                                    .get(&clock_id)
                                    .unwrap(),
                            })
                            .unwrap(),
                        ))
                        .await
                        .is_err()
                    {
                        break;
                    };
                }
                SyncRequest::DeleteClock(player_id, clock_id) => {
                    if sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::DeleteClock {
                                player_id,
                                clock_id,
                            })
                            .unwrap(),
                        ))
                        .await
                        .is_err()
                    {
                        break;
                    };
                }
                SyncRequest::AddPlayer(player_id) => {
                    if sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::Player {
                                player_id,
                                player_data: &bitd.players.get(&player_id).unwrap(),
                            })
                            .unwrap(),
                        ))
                        .await
                        .is_err()
                    {
                        break;
                    };
                }
                SyncRequest::RenamePlayer(player_id) => {
                    if sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::PlayerName {
                                player_id,
                                player_name: &bitd.players.get(&player_id).unwrap().name,
                            })
                            .unwrap(),
                        ))
                        .await
                        .is_err()
                    {
                        break;
                    };
                }
                SyncRequest::RemovePlayer(player_id) => {
                    if sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::RemovePlayer { player_id })
                                .unwrap(),
                        ))
                        .await
                        .is_err()
                    {
                        break;
                    };
                }
            }
        }
    });

    // Clone things we want to pass (move) to the receiving task.
    let tx = state.tx.clone();
    let mut bitd = state.bitd.clone();

    // This task receives instrutions from the client, performs the appropriate modifications to
    // app state, and communicates to the send_task to dispatch an appropriate update to the
    // clients.
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            if let Ok(inst) = serde_json::from_str(&text) {
                match inst {
                    Instruction::FullSync => {
                        if tx.send(SyncRequest::Full).is_err() {
                            break;
                        };
                    }
                    Instruction::AddClock(player_id, task, slices) => {
                        let clock_id = bitd.add_clock(player_id, task, slices);
                        bitd.backup_player(player_id);
                        if tx.send(SyncRequest::Clock(player_id, clock_id)).is_err() {
                            break;
                        };
                    }
                    Instruction::DeleteClock(player_id, clock_id) => {
                        bitd.delete_clock(player_id, clock_id);
                        bitd.backup_player(player_id);
                        if tx
                            .send(SyncRequest::DeleteClock(player_id, clock_id))
                            .is_err()
                        {
                            break;
                        };
                    }
                    Instruction::IncrementClock(player_id, clock_id) => {
                        bitd.increment_clock(player_id, clock_id);
                        bitd.backup_player(player_id);
                        if tx.send(SyncRequest::Clock(player_id, clock_id)).is_err() {
                            break;
                        };
                    }
                    Instruction::DecrementClock(player_id, clock_id) => {
                        bitd.decrement_clock(player_id, clock_id);
                        bitd.backup_player(player_id);
                        if tx.send(SyncRequest::Clock(player_id, clock_id)).is_err() {
                            break;
                        };
                    }
                    Instruction::AddPlayer(name) => {
                        let player_id = bitd.add_player(name);
                        bitd.backup_player(player_id);
                        if tx.send(SyncRequest::AddPlayer(player_id)).is_err() {
                            break;
                        };
                    }
                    Instruction::RenamePlayer(player_id, name) => {
                        bitd.rename_player(player_id, name);
                        bitd.backup_player(player_id);
                        if tx.send(SyncRequest::RenamePlayer(player_id)).is_err() {
                            break;
                        };
                    }
                    Instruction::RemovePlayer(player_id) => {
                        bitd.remove_player(player_id);
                        if tx.send(SyncRequest::RemovePlayer(player_id)).is_err() {
                            break;
                        };
                    }
                }
            }
        }
    });

    // If any one of the tasks run to completion, we abort the other.
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
