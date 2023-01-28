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
    id: ClockId,
    task: String,
    slices: u8,
    progress: u8,
}

impl Clock {
    fn new(task: String, slices: u8) -> Self {
        return Clock {
            id: Uuid::new_v4(),
            task,
            slices,
            progress: 0,
        };
    }

    fn increment(&mut self) {
        self.progress = u8::max(self.progress + 1, self.slices);
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct PlayerData {
    name: String,
    clocks: Vec<Clock>,
    // clocks: DashMap<ClockId, Clock>,
}

impl PlayerData {
    fn new(name: String) -> Self {
        return PlayerData {
            name,
            clocks: Vec::new(),
            // clocks: DashMap::new(),
        };
    }

    fn add_clock(&mut self, task: String, slices: u8) -> ClockId {
        let c = Clock::new(task, slices);
        let id = c.id;
        self.clocks.push(c);
        id
    }

    // fn add_clock(&mut self, task: String, slices: u8) -> ClockId {
    //     self.clocks.insert(id, Clock::new(task, slices));
    //     id
    // }

    fn get_clock_by_id(&self, id: ClockId) -> Option<&Clock> {
        for c in self.clocks.iter() {
            if c.id == id {
                return Some(c);
            }
        }
        None
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

    fn add_clock(&mut self, player_id: Uuid, task: String, slices: u8) {
        self.players
            .get_mut(&player_id)
            .unwrap()
            .add_clock(task, slices);
    }

    fn increment_clock(&mut self, player_id: PlayerId, clock_id: ClockId) {
        let mut player = self.players.get_mut(&player_id).unwrap();

        for c in player.clocks.iter_mut() {
            if c.id == clock_id {
                c.increment();
                return;
            }
        }
        // player.clocks.get_mut(&clock_id).unwrap().increment();
    }
}

// Our shared state
struct AppState {
    // We require unique usernames. This tracks which usernames have been taken.
    bitd: Bitd,
    // Channel used to send messages to all connected clients.
    tx: broadcast::Sender<SyncRequest>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
enum Instruction {
    /// Sent to the server by the client to request a change to state.
    FullSync,
    AddClock(PlayerId, String, u8),
    Log(String),
    // ClockIncrement(PlayerId, ClockId),
    // ClockDecrement(PlayerId, ClockId),
}

#[derive(Serialize, Debug, Clone)]
enum SyncRequest {
    /// Pieces of state sent from the server to the client after a change.
    ClockSync(PlayerId, ClockId),
    FullSync,
    PlayerSync(PlayerId),
    AllClocksSync(PlayerId),
}

#[derive(Serialize, Debug, Clone)]
enum UpdatePacket<'a> {
    /// Pieces of state sent from the server to the client after a change.
    ClockUpdate(&'a Clock),
    PlayerUpdate(&'a PlayerData),
    AllPlayersUpdate(&'a DashMap<PlayerId, PlayerData>),
    AllClocksUpdate(PlayerId, Vec<Clock>),
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

    dbg!(
        serde_json::to_string(&Instruction::AddClock(p1_id, "test clock".to_string(), 9)).unwrap()
    );

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
                    sender
                        .send(Message::Text(
                            // serde_json::to_string(&UpdatePacket::FullSync(players)).unwrap(),
                            serde_json::to_string(&UpdatePacket::AllPlayersUpdate(&*bitd.players))
                                .unwrap(),
                        ))
                        .await;
                }
                SyncRequest::PlayerSync(player_id) => {
                    sender
                        .send(Message::Text(
                            // serde_json::to_string(&UpdatePacket::FullSync(players)).unwrap(),
                            serde_json::to_string(&UpdatePacket::PlayerUpdate(
                                &*bitd.players.get(&player_id).unwrap(),
                            ))
                            .unwrap(),
                        ))
                        .await;
                }
                SyncRequest::AllClocksSync(player_id) => {
                    let clocks = bitd.players.get_mut(&player_id).unwrap().clocks.clone();

                    sender
                        .send(Message::Text(
                            serde_json::to_string(&UpdatePacket::AllClocksUpdate(
                                player_id, clocks,
                            ))
                            .unwrap(),
                        ))
                        .await;
                }
                SyncRequest::ClockSync(player_id, clock_id) => {
                    sender
                        .send(Message::Text(
                            // serde_json::to_string(&UpdatePacket::FullSync(players)).unwrap(),
                            serde_json::to_string(&UpdatePacket::ClockUpdate(
                                &*bitd
                                    .players
                                    .get(&player_id)
                                    .unwrap()
                                    .get_clock_by_id(clock_id)
                                    .unwrap(),
                            ))
                            .unwrap(),
                        ))
                        .await;
                }
            }
        }
    });

    // Clone things we want to pass (move) to the receiving task.
    let tx = state.tx.clone();
    let bitd = state.bitd.clone();

    // Spawn a task that takes messages from the websocket, prepends the user
    // name, and sends them to all broadcast subscribers.
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            if let Ok(inst) = serde_json::from_str(&text) {
                match inst {
                    Instruction::FullSync => {
                        // dispatch a clocks update
                        tx.send(SyncRequest::FullSync);
                    }
                    Instruction::AddClock(player_id, task, slices) => {
                        dbg!("adding clock...");
                        let _clock_id = bitd
                            .players
                            .get_mut(&player_id)
                            .unwrap()
                            .add_clock(task, slices);
                        // TODO: Possibly send only the clock that was updated
                        // tx.send(SyncRequest::ClockSync(player_id, clock_id));
                        tx.send(SyncRequest::AllClocksSync(player_id));
                    }
                    _ => {}
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
