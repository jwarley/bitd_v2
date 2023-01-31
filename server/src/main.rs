//! Example chat application.
//!
//! Run with
//!
//! ```not_rust
//! cd examples && cargo run -p example-chat
//! ```

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use axum_extra::routing::SpaRouter;
// use axum_typed_websockets::{Message, WebSocket, WebSocketUpgrade}
use dashmap::DashMap;
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    net::SocketAddr,
    sync::{Arc, Mutex},
};
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
        return Clock {
            task,
            slices,
            progress: 0,
        };
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
        return PlayerData {
            name,
            clocks: DashMap::new(),
        };
    }

    fn add_clock(&mut self, task: String, slices: u8) -> ClockId {
        let id = Uuid::new_v4();
        self.clocks.insert(id, Clock::new(task, slices));
        id
    }

    fn delete_clock(&mut self, id: ClockId) {
        self.clocks.remove(&id);
    }
}

#[derive(Clone, Debug)]
struct Bitd {
    players: Arc<DashMap<PlayerId, PlayerData>>,
}

impl Bitd {
    fn add_player(&mut self, name: String) -> Uuid {
        let player_id = Uuid::new_v4();
        self.players.insert(player_id, PlayerData::new(name));
        player_id
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
}

#[derive(Serialize, Debug, Clone)]
enum SyncRequest {
    /// Messages broadcast to the send task to trigger a state update to any websocket clients
    ClockSync(PlayerId, ClockId),
    DeleteClockSync(PlayerId, ClockId),
    FullSync,
}

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type")]
enum UpdatePacket<'a> {
    /// Pieces of state sent from the server to the client after a change.
    ClockUpdate {
        player_id: PlayerId,
        clock_id: ClockId,
        clock: &'a Clock,
    },
    DeleteClockUpdate {
        player_id: PlayerId,
        clock_id: ClockId,
    },
    FullUpdate(&'a DashMap<PlayerId, PlayerData>),
}

#[tokio::main]
async fn main() {
    // Set up application state for use with with_state().
    let (tx, _rx) = broadcast::channel(100);

    // Making some dummy data
    let mut bitd = Bitd {
        players: Arc::new(DashMap::new()),
    };

    let p1_id = bitd.add_player("branch".to_string());
    let p2_id = bitd.add_player("tiktok".to_string());

    bitd.add_clock(p1_id, "spicy goblins".to_string(), 5);
    bitd.add_clock(p1_id, "the big man comes".to_string(), 3);
    bitd.add_clock(p2_id, "make another the moon".to_string(), 2);

    // use this to preview json reprs of newly defined types
    // dbg!(
    //     serde_json::to_string_pretty(&Instruction::AddClock(p1_id, "test clock".to_string(), 9))
    //         .unwrap()
    // );

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
                SyncRequest::FullSync => {
                    if sender
                        .send(Message::Text(
                            // serde_json::to_string(&UpdatePacket::FullSync(players)).unwrap(),
                            serde_json::to_string(&UpdatePacket::FullUpdate(&*bitd.players))
                                .unwrap(),
                        ))
                        .await
                        .is_err()
                    {
                        break;
                    };
                }
                SyncRequest::ClockSync(player_id, clock_id) => {
                    if sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::ClockUpdate {
                                player_id,
                                clock_id,
                                clock: &*bitd
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
                SyncRequest::DeleteClockSync(player_id, clock_id) => {
                    if sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::DeleteClockUpdate {
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
            }
        }
    });

    // Clone things we want to pass (move) to the receiving task.
    let tx = state.tx.clone();
    let bitd = state.bitd.clone();

    // This task receives instrutions from the client, performs the appropriate modifications to
    // app state, and communicates to the send_task to dispatch an appropriate update to the
    // clients.
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            if let Ok(inst) = serde_json::from_str(&text) {
                match inst {
                    Instruction::FullSync => {
                        if tx.send(SyncRequest::FullSync).is_err() {
                            break;
                        };
                    }
                    Instruction::AddClock(player_id, task, slices) => {
                        let clock_id = bitd.add_clock(player_id, task, slices);
                        // let clock_id = bitd
                        //     .players
                        //     .get_mut(&player_id)
                        //     .unwrap()
                        //     .add_clock(task, slices);
                        if tx
                            .send(SyncRequest::ClockSync(player_id, clock_id))
                            .is_err()
                        {
                            break;
                        };
                    }
                    Instruction::DeleteClock(player_id, clock_id) => {
                        bitd.delete_clock(player_id, clock_id);
                        // bitd.players
                        //     .get_mut(&player_id)
                        //     .unwrap()
                        //     .delete_clock(clock_id);
                        if tx
                            .send(SyncRequest::DeleteClockSync(player_id, clock_id))
                            .is_err()
                        {
                            break;
                        };
                    }
                    Instruction::IncrementClock(player_id, clock_id) => {
                        bitd.increment_clock(player_id, clock_id);
                        if tx
                            .send(SyncRequest::ClockSync(player_id, clock_id))
                            .is_err()
                        {
                            break;
                        };
                    }
                    Instruction::DecrementClock(player_id, clock_id) => {
                        bitd.decrement_clock(player_id, clock_id);
                        if tx
                            .send(SyncRequest::ClockSync(player_id, clock_id))
                            .is_err()
                        {
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
