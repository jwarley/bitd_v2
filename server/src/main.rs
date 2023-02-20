use anyhow::Result;
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
use std::path::PathBuf;
use thiserror::Error;
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
type LandmarkId = Uuid;
type NoteId = Uuid;

#[derive(Clone, Debug, Error, Serialize)]
pub enum BitdError {
    #[error("Player lookup failed.\nPlayer: {0}")]
    PlayerLookup(PlayerId),
    #[error("Clock lookup failed.\nPlayer: {0}\nClock: {1}")]
    ClockLookup(PlayerId, ClockId),
}

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

#[derive(Clone, Debug, Serialize, Deserialize)]
struct Landmark {
    name: String,
    x: f64,
    y: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
enum NoteKind {
    Concept,
    Boogins,
    Event,
    Item,
    Misc,
    Person,
    Place,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
struct Note {
    name: String,
    content: f64,
    kind: NoteKind,
}

#[derive(Clone, Debug)]
struct Bitd {
    players: Arc<DashMap<PlayerId, PlayerData>>,
    landmarks: Arc<DashMap<LandmarkId, Landmark>>,
    notes: Arc<DashMap<NoteId, Note>>,
    save_dir: PathBuf,
}

impl Bitd {
    fn new(save_dir: PathBuf) -> Self {
        let mut bitd = Bitd {
            players: Arc::new(DashMap::new()),
            landmarks: Arc::new(DashMap::new()),
            notes: Arc::new(DashMap::new()),
            save_dir,
        };

        match fs::create_dir_all(&bitd.save_dir) {
            Err(e) => {
                println!(
                    "Could not create save directory at {}. Cause:\n {}",
                    &bitd.save_dir.display(),
                    e
                )
            }
            Ok(_) => {
                // if the previous create_dir succeeded, should be fine to unwrap
                fs::create_dir_all(bitd.players_dir()).unwrap();
            }
        }

        if let Err(e) = bitd.load_players_backup() {
            println!("Warning: Failed to load players from backup. Cause:\n {e}")
        }

        if let Err(e) = bitd.load_landmarks_backup() {
            println!("Warning: Failed to load landmarks from backup. Cause:\n {e}");
        }

        if let Err(e) = bitd.load_notes_backup() {
            println!("Warning: Failed to load notes from backup. Cause:\n {e}");
        }

        bitd
    }

    fn add_player(&mut self, name: String) -> PlayerId {
        let player_id = Uuid::now_v7();
        self.players.insert(player_id, PlayerData::new(name));
        player_id
    }

    fn rename_player(&mut self, player_id: PlayerId, name: String) -> Option<String> {
        self.players.get_mut(&player_id).map(|mut p| p.rename(name))
    }

    fn remove_player(&mut self, player_id: PlayerId) {
        // TODO: error handling
        self.players.remove(&player_id);
        if fs::remove_file(format!("./players/{}.toml", player_id)).is_err() {
            println!("Failed to remove user file: {}", player_id)
        };
    }

    fn add_clock(&self, player_id: PlayerId, task: String, slices: u8) -> Result<ClockId> {
        Ok(self
            .players
            .get_mut(&player_id)
            .ok_or(BitdError::PlayerLookup(player_id))?
            .add_clock(task, slices))
    }

    fn delete_clock(&self, player_id: PlayerId, clock_id: ClockId) -> Result<()> {
        self.players
            .get_mut(&player_id)
            .ok_or(BitdError::PlayerLookup(player_id))?
            .delete_clock(clock_id);
        Ok(())
    }

    fn increment_clock(&self, player_id: PlayerId, clock_id: ClockId) -> Result<()> {
        let player = self
            .players
            .get_mut(&player_id)
            .ok_or(BitdError::PlayerLookup(player_id))?;
        player
            .clocks
            .get_mut(&clock_id)
            .ok_or(BitdError::ClockLookup(player_id, clock_id))?
            .increment();
        Ok(())
    }

    fn decrement_clock(&self, player_id: PlayerId, clock_id: ClockId) -> Result<()> {
        let player = self
            .players
            .get_mut(&player_id)
            .ok_or(BitdError::PlayerLookup(player_id))?;
        player
            .clocks
            .get_mut(&clock_id)
            .ok_or(BitdError::ClockLookup(player_id, clock_id))?
            .decrement();
        Ok(())
    }

    fn players_dir(&self) -> String {
        format!("{}/players", self.save_dir.display())
    }

    fn notes_dir(&self) -> String {
        self.save_dir.display().to_string()
    }

    fn landmarks_dir(&self) -> String {
        self.save_dir.display().to_string()
    }

    fn backup_player(&self, player_id: PlayerId) -> Result<()> {
        let player = self
            .players
            .get(&player_id)
            .ok_or(BitdError::PlayerLookup(player_id))?;
        fs::write(
            format!("{}/{}.toml", self.players_dir(), player_id),
            toml::to_string_pretty(&*player)?,
        )?;
        Ok(())
    }

    fn load_players_backup(&mut self) -> Result<()> {
        for path in glob(&format!("{}/*.toml", self.players_dir()))
            .expect("Failed to read glob pattern.")
            .filter_map(Result::ok)
        {
            if let (Some(stem), Ok(contents)) = (
                path.file_stem().unwrap().to_str(), // unwrap is safe bc we know path matches *.toml
                &fs::read_to_string(&path),
            ) {
                if let Ok(uuid) = Uuid::try_parse(stem) {
                    if let Ok(player) = toml::from_str(contents) {
                        self.players.insert(uuid, player);
                    }
                }
            }
        }
        Ok(())
    }

    fn add_landmark(&mut self, name: String, x: f64, y: f64) -> LandmarkId {
        let id = Uuid::now_v7();
        self.landmarks.insert(id, Landmark { name, x, y });
        id
    }

    fn backup_landmarks(&self) -> Result<()> {
        fs::write(
            format!("{}/landmarks.toml", self.landmarks_dir()),
            toml::to_string_pretty(&*self.landmarks)?,
        )?;
        Ok(())
    }

    fn load_landmarks_backup(&mut self) -> Result<()> {
        self.landmarks = Arc::new(toml::from_str(&fs::read_to_string(format!(
            "{}/landmarks.toml",
            self.landmarks_dir()
        ))?)?);
        Ok(())
    }

    fn backup_notes(&self) -> Result<()> {
        fs::write(
            format!("{}/notes.toml", self.notes_dir()),
            toml::to_string_pretty(&*self.notes)?,
        )?;
        Ok(())
    }

    fn load_notes_backup(&mut self) -> Result<()> {
        self.notes = Arc::new(toml::from_str(&fs::read_to_string(format!(
            "{}/notes.toml",
            self.notes_dir()
        ))?)?);
        Ok(())
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
    AddLandmark(String, f64, f64),
}

#[derive(Serialize, Debug, Clone)]
enum SyncRequest {
    /// Messages broadcast to the send task to trigger a state update to any websocket clients
    Full,
    Error(String),
    Clock(PlayerId, ClockId),
    DeleteClock(PlayerId, ClockId),
    AddPlayer(PlayerId),
    RenamePlayer(PlayerId),
    RemovePlayer(PlayerId),
    AddLandmark(LandmarkId),
}

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type")]
enum UpdatePacket<'a> {
    /// Pieces of state sent from the server to the client after a change.
    Full {
        players: &'a DashMap<PlayerId, PlayerData>,
        landmarks: &'a DashMap<LandmarkId, Landmark>,
    },
    Error {
        text: String,
    },
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
    Landmark {
        id: LandmarkId,
        data: &'a Landmark,
    },
}

#[tokio::main]
async fn main() {
    // use this to preview json reprs of newly defined types
    // dbg!(toml::to_string(&bup));

    let bitd = Bitd::new("./data".into());

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
                            serde_json::to_string(&UpdatePacket::Full {
                                players: &bitd.players,
                                landmarks: &bitd.landmarks,
                            })
                            .unwrap(),
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
                SyncRequest::Error(e) => {
                    if sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::Error {
                                text: e.to_string(),
                            })
                            .unwrap(),
                        ))
                        .await
                        .is_err()
                    {
                        break;
                    };
                }
                SyncRequest::AddLandmark(id) => {
                    if sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::Landmark {
                                id,
                                data: &bitd.landmarks.get(&id).unwrap(),
                            })
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
                        let sync_req = match bitd.add_clock(player_id, task, slices) {
                            Ok(clock_id) => bitd.backup_player(player_id).map_or_else(
                                |e| SyncRequest::Error(format!("{e}")),
                                |_| SyncRequest::Clock(player_id, clock_id),
                            ),
                            Err(e) => SyncRequest::Error(format!("{e}")),
                        };
                        if tx.send(sync_req).is_err() {
                            break;
                        };
                    }
                    Instruction::DeleteClock(player_id, clock_id) => {
                        let sync_req = match bitd.delete_clock(player_id, clock_id) {
                            Ok(_) => bitd.backup_player(player_id).map_or_else(
                                |e| SyncRequest::Error(format!("{e}")),
                                |_| SyncRequest::DeleteClock(player_id, clock_id),
                            ),
                            Err(e) => SyncRequest::Error(format!("{e}")),
                        };
                        if tx.send(sync_req).is_err() {
                            break;
                        };
                    }
                    Instruction::IncrementClock(player_id, clock_id) => {
                        let sync_req = match bitd.increment_clock(player_id, clock_id) {
                            Ok(_) => bitd.backup_player(player_id).map_or_else(
                                |e| SyncRequest::Error(format!("{e}")),
                                |_| SyncRequest::Clock(player_id, clock_id),
                            ),
                            Err(e) => SyncRequest::Error(format!("{e}")),
                        };
                        if tx.send(sync_req).is_err() {
                            break;
                        };
                    }
                    Instruction::DecrementClock(player_id, clock_id) => {
                        let sync_req = match bitd.decrement_clock(player_id, clock_id) {
                            Ok(_) => bitd.backup_player(player_id).map_or_else(
                                |e| SyncRequest::Error(format!("{e}")),
                                |_| SyncRequest::Clock(player_id, clock_id),
                            ),
                            Err(e) => SyncRequest::Error(format!("{e}")),
                        };
                        if tx.send(sync_req).is_err() {
                            break;
                        };
                    }
                    Instruction::AddPlayer(name) => {
                        let player_id = bitd.add_player(name);
                        let sync_req = bitd.backup_player(player_id).map_or_else(
                            |e| SyncRequest::Error(format!("{e}")),
                            |_| SyncRequest::AddPlayer(player_id),
                        );
                        if tx.send(sync_req).is_err() {
                            break;
                        };
                    }
                    Instruction::RenamePlayer(player_id, name) => {
                        bitd.rename_player(player_id, name);
                        let sync_req = bitd.backup_player(player_id).map_or_else(
                            |e| SyncRequest::Error(format!("{e}")),
                            |_| SyncRequest::RenamePlayer(player_id),
                        );
                        if tx.send(sync_req).is_err() {
                            break;
                        };
                    }
                    Instruction::RemovePlayer(player_id) => {
                        bitd.remove_player(player_id);
                        if tx.send(SyncRequest::RemovePlayer(player_id)).is_err() {
                            break;
                        };
                    }
                    Instruction::AddLandmark(name, x, y) => {
                        let landmark_id = bitd.add_landmark(name, x, y);
                        let sync_req = bitd.backup_landmarks().map_or_else(
                            |e| SyncRequest::Error(format!("{e}")),
                            |_| SyncRequest::AddLandmark(landmark_id),
                        );
                        if tx.send(sync_req).is_err() {
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
