#!/usr/bin/env python3
"""Render one inherited, stateful FIELD STATION: MAGPIE lineage iteration."""
from __future__ import annotations

import argparse
import copy
import json
import math
import random
import subprocess
import tempfile
from pathlib import Path
from statistics import mean

from PIL import Image, ImageDraw, ImageFilter, ImageFont

WIDTH = 960
HEIGHT = 720
FPS = 12
DURATION_SECONDS = 8
FRAME_COUNT = FPS * DURATION_SECONDS

BG = (5, 7, 6, 255)
PAPER = (216, 221, 211, 255)
MUTED = (127, 139, 130, 255)
ORANGE = (255, 104, 28, 255)
PHOSPHOR = (111, 225, 187, 255)

PHASES = [
    "ORIENTATION",
    "GROWTH",
    "ENTANGLEMENT",
    "SATURATION",
    "FRACTURE",
    "REPAIR",
    "REORIENTATION",
]


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def load_json(path: Path | None):
    if path is None or not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def load_fonts():
    try:
        return (
            ImageFont.truetype("DejaVuSansMono.ttf", 18),
            ImageFont.truetype("DejaVuSansMono.ttf", 13),
            ImageFont.truetype("DejaVuSansMono.ttf", 11),
        )
    except OSError:
        fallback = ImageFont.load_default()
        return fallback, fallback, fallback


def quadratic_point(p0, p1, p2, amount: float):
    inverse = 1.0 - amount
    return (
        inverse * inverse * p0[0] + 2 * inverse * amount * p1[0] + amount * amount * p2[0],
        inverse * inverse * p0[1] + 2 * inverse * amount * p1[1] + amount * amount * p2[1],
    )


def draw_curve(draw: ImageDraw.ImageDraw, p0, p1, p2, fill, width: int = 1):
    points = [quadratic_point(p0, p1, p2, index / 28) for index in range(29)]
    draw.line(points, fill=fill, width=width)


def build_initial_nodes(rng: random.Random):
    nodes = []
    columns = 8
    rows = 4
    x_margin = 78
    y_margin = 112
    x_step = (WIDTH - x_margin * 2) / (columns - 1)
    y_step = (HEIGHT - y_margin * 2) / (rows - 1)
    node_id = 1
    for row in range(rows):
        for column in range(columns):
            cluster = 0 if column < 3 else 1 if column < 6 else 2
            nodes.append(
                {
                    "id": f"N{node_id:03d}",
                    "x": x_margin + column * x_step + rng.uniform(-24, 24),
                    "y": y_margin + row * y_step + rng.uniform(-30, 30),
                    "phase": rng.uniform(0, math.tau),
                    "weight": rng.uniform(0.35, 1.0),
                    "x_motion": rng.uniform(3, 13),
                    "y_motion": rng.uniform(3, 11),
                    "cluster": cluster,
                    "scar": 0.0,
                    "residue": 0.0,
                }
            )
            node_id += 1
    return nodes


def nearest_connections(nodes, rng: random.Random, neighbors: int = 2):
    connections = []
    seen = set()
    for index, node in enumerate(nodes):
        distances = []
        for other_index, other in enumerate(nodes):
            if other_index == index:
                continue
            distance = math.hypot(other["x"] - node["x"], other["y"] - node["y"])
            distances.append((distance, other_index))
        distances.sort(key=lambda item: item[0])
        for _, other_index in distances[:neighbors]:
            pair = tuple(sorted((node["id"], nodes[other_index]["id"])))
            if pair in seen:
                continue
            seen.add(pair)
            other = nodes[other_index]
            connections.append(
                {
                    "id": f"E{len(connections) + 1:04d}",
                    "a": node["id"],
                    "b": other["id"],
                    "curve_x": (node["x"] + other["x"]) / 2 + rng.uniform(-34, 34),
                    "curve_y": (node["y"] + other["y"]) / 2 + rng.uniform(-34, 34),
                    "phase": rng.uniform(0, math.tau),
                    "orange": rng.random() < 0.22,
                    "tension": rng.uniform(0.7, 1.3),
                    "damage": 0.0,
                }
            )
    return connections


def initialize_state(seed: int, generation: int, parent_id: str | None):
    rng = random.Random(seed)
    nodes = build_initial_nodes(rng)
    connections = nearest_connections(nodes, rng, 2)
    return {
        "schema_version": "2.0.0",
        "generation": max(0, generation - 1),
        "parent_archive_id": parent_id,
        "developmental_phase": PHASES[((max(1, generation) - 1) // 24) % len(PHASES)],
        "phase_index": ((max(1, generation) - 1) // 24) % len(PHASES),
        "phase_age": 0,
        "topology": "distributed relation field",
        "nodes": nodes,
        "connections": connections,
        "connection_rules": {
            "nearest_neighbors": 2,
            "cross_cluster_bias": 0.18,
            "repair_bias": 0.35,
        },
        "field_tension": 1.0,
        "drift_direction": {"x": 0.35, "y": -0.15},
        "growth_bias": {"x": 0.32, "y": 0.0},
        "movement_speed": 1.0,
        "damage": 0.0,
        "residue": 0.0,
        "anomalies": [],
        "palette_state": {"orange_ratio": 0.22, "phosphor_energy": 1.0, "desaturation": 0.0},
        "secondary_fields": [],
        "interface_modules": ["header", "execution-footer"],
        "next_structural_generation": max(1, generation) + rng.randint(6, 12),
        "mutation_history": [],
        "last_metrics": {},
    }


def node_map(state):
    return {node["id"]: node for node in state["nodes"]}


def connection_pairs(state):
    return {tuple(sorted((item["a"], item["b"]))) for item in state["connections"]}


def add_connection(state, a: str, b: str, rng: random.Random, orange: bool | None = None):
    pair = tuple(sorted((a, b)))
    if a == b or pair in connection_pairs(state):
        return False
    nodes = node_map(state)
    if a not in nodes or b not in nodes:
        return False
    first, second = nodes[a], nodes[b]
    state["connections"].append(
        {
            "id": f"E{len(state['connections']) + 1:04d}",
            "a": a,
            "b": b,
            "curve_x": (first["x"] + second["x"]) / 2 + rng.uniform(-38, 38),
            "curve_y": (first["y"] + second["y"]) / 2 + rng.uniform(-38, 38),
            "phase": rng.uniform(0, math.tau),
            "orange": rng.random() < state["palette_state"]["orange_ratio"] if orange is None else orange,
            "tension": rng.uniform(0.75, 1.25),
            "damage": 0.0,
        }
    )
    return True


def calculate_clusters(state):
    adjacency = {node["id"]: set() for node in state["nodes"]}
    for edge in state["connections"]:
        if edge["damage"] >= 0.95:
            continue
        adjacency[edge["a"]].add(edge["b"])
        adjacency[edge["b"]].add(edge["a"])
    visited = set()
    clusters = 0
    for node_id in adjacency:
        if node_id in visited:
            continue
        clusters += 1
        stack = [node_id]
        visited.add(node_id)
        while stack:
            current = stack.pop()
            for neighbor in adjacency[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    stack.append(neighbor)
    return clusters


def calculate_metrics(state):
    node_count = len(state["nodes"])
    active_connections = [edge for edge in state["connections"] if edge["damage"] < 0.95]
    possible = max(1, node_count * (node_count - 1) / 2)
    xs = [node["x"] for node in state["nodes"]] or [0]
    center = mean(xs)
    mirrored = [abs((WIDTH - x) - center) for x in xs]
    symmetry = 1.0 - clamp(mean(mirrored) / WIDTH, 0.0, 1.0)
    return {
        "node_count": node_count,
        "cluster_count": calculate_clusters(state),
        "connection_count": len(active_connections),
        "connectivity": round(len(active_connections) / possible, 4),
        "field_direction": {
            "x": round(state["drift_direction"]["x"], 3),
            "y": round(state["drift_direction"]["y"], 3),
        },
        "anomaly_count": len(state["anomalies"]),
        "residue": round(state["residue"], 3),
        "symmetry": round(symmetry, 3),
        "fragmentation": round(calculate_clusters(state) / max(1, node_count), 4),
        "movement_speed": round(state["movement_speed"], 3),
        "phase": state["developmental_phase"],
        "orange_ratio": round(state["palette_state"]["orange_ratio"], 3),
        "damage": round(state["damage"], 3),
        "field_tension": round(state["field_tension"], 3),
    }


def mutate_small(state, rng: random.Random):
    drift = state["drift_direction"]
    drift["x"] = clamp(drift["x"] + rng.uniform(-0.09, 0.09), -1.0, 1.0)
    drift["y"] = clamp(drift["y"] + rng.uniform(-0.09, 0.09), -1.0, 1.0)
    state["field_tension"] = clamp(state["field_tension"] + rng.uniform(-0.06, 0.06), 0.45, 1.8)
    state["movement_speed"] = clamp(state["movement_speed"] + rng.uniform(-0.045, 0.045), 0.35, 1.9)
    state["residue"] = clamp(state["residue"] * 0.985 + rng.uniform(0.002, 0.018), 0.0, 1.0)
    palette = state["palette_state"]
    palette["orange_ratio"] = clamp(palette["orange_ratio"] + rng.uniform(-0.018, 0.018), 0.06, 0.62)
    palette["phosphor_energy"] = clamp(palette["phosphor_energy"] + rng.uniform(-0.03, 0.03), 0.45, 1.5)

    for node in state["nodes"]:
        node["x"] = clamp(node["x"] + drift["x"] * rng.uniform(0.8, 3.0) + rng.uniform(-2.4, 2.4), 42, WIDTH - 42)
        node["y"] = clamp(node["y"] + drift["y"] * rng.uniform(0.8, 3.0) + rng.uniform(-2.4, 2.4), 76, HEIGHT - 78)
        node["phase"] = (node["phase"] + rng.uniform(-0.13, 0.13)) % math.tau
        node["x_motion"] = clamp(node["x_motion"] + rng.uniform(-0.7, 0.7), 1.5, 24)
        node["y_motion"] = clamp(node["y_motion"] + rng.uniform(-0.7, 0.7), 1.5, 24)
        node["residue"] = clamp(node["residue"] * 0.98 + state["residue"] * 0.006, 0.0, 1.0)

    for edge in state["connections"]:
        edge["curve_x"] += rng.uniform(-3.0, 3.0) * state["field_tension"]
        edge["curve_y"] += rng.uniform(-3.0, 3.0) * state["field_tension"]
        edge["tension"] = clamp(edge["tension"] + rng.uniform(-0.04, 0.04), 0.35, 2.2)
        if rng.random() < 0.015:
            edge["orange"] = not edge["orange"]


def add_cluster(state, rng: random.Random, side: str):
    count = rng.randint(3, 6)
    cluster_id = max((node.get("cluster", 0) for node in state["nodes"]), default=0) + 1
    anchor_x = WIDTH - 95 if side == "eastern" else 95 if side == "western" else rng.uniform(160, WIDTH - 160)
    anchor_y = rng.uniform(145, HEIGHT - 145)
    new_ids = []
    for _ in range(count):
        node_id = f"N{len(state['nodes']) + 1:03d}"
        state["nodes"].append(
            {
                "id": node_id,
                "x": clamp(anchor_x + rng.uniform(-46, 46), 42, WIDTH - 42),
                "y": clamp(anchor_y + rng.uniform(-56, 56), 76, HEIGHT - 78),
                "phase": rng.uniform(0, math.tau),
                "weight": rng.uniform(0.45, 1.0),
                "x_motion": rng.uniform(4, 15),
                "y_motion": rng.uniform(4, 15),
                "cluster": cluster_id,
                "scar": 0.0,
                "residue": state["residue"],
            }
        )
        new_ids.append(node_id)
    for index in range(len(new_ids) - 1):
        add_connection(state, new_ids[index], new_ids[index + 1], rng, orange=True)
    existing = [node["id"] for node in state["nodes"] if node["id"] not in new_ids]
    if existing:
        add_connection(state, rng.choice(new_ids), rng.choice(existing), rng, orange=True)
    return count, cluster_id


def structural_mutation(state, rng: random.Random):
    choices = ["new_cluster", "broken_connection", "secondary_field", "movement_rule", "interface_module"]
    mutation = rng.choice(choices)
    details = {}
    if mutation == "new_cluster":
        side = rng.choice(["eastern", "western", "central"])
        count, cluster_id = add_cluster(state, rng, side)
        details = {"side": side, "nodes_added": count, "cluster_id": cluster_id}
    elif mutation == "broken_connection" and state["connections"]:
        edge = rng.choice(state["connections"])
        edge["damage"] = 1.0
        state["damage"] = clamp(state["damage"] + 0.08, 0.0, 1.0)
        nodes = node_map(state)
        nodes[edge["a"]]["scar"] = clamp(nodes[edge["a"]]["scar"] + 0.2, 0.0, 1.0)
        nodes[edge["b"]]["scar"] = clamp(nodes[edge["b"]]["scar"] + 0.2, 0.0, 1.0)
        details = {"connection": edge["id"], "between": [edge["a"], edge["b"]]}
    elif mutation == "secondary_field":
        field = {
            "id": f"SF{len(state['secondary_fields']) + 1:02d}",
            "x": rng.uniform(140, WIDTH - 140),
            "y": rng.uniform(130, HEIGHT - 130),
            "radius": rng.uniform(70, 150),
            "direction": rng.choice([-1, 1]),
            "strength": rng.uniform(0.25, 0.75),
        }
        state["secondary_fields"].append(field)
        details = field
    elif mutation == "movement_rule":
        state["connection_rules"]["cross_cluster_bias"] = clamp(
            state["connection_rules"]["cross_cluster_bias"] + rng.uniform(-0.12, 0.2), 0.02, 0.8
        )
        state["growth_bias"]["x"] = clamp(state["growth_bias"]["x"] + rng.uniform(-0.35, 0.35), -1, 1)
        state["growth_bias"]["y"] = clamp(state["growth_bias"]["y"] + rng.uniform(-0.35, 0.35), -1, 1)
        details = {"growth_bias": copy.deepcopy(state["growth_bias"]), "cross_cluster_bias": state["connection_rules"]["cross_cluster_bias"]}
    else:
        available = ["residue-meter", "phase-map", "fracture-ledger", "anomaly-window", "lineage-pulse"]
        module = rng.choice([item for item in available if item not in state["interface_modules"]] or available)
        if module not in state["interface_modules"]:
            state["interface_modules"].append(module)
        details = {"module": module}
    state["next_structural_generation"] = state["generation"] + rng.randint(6, 12)
    return mutation, details


def apply_phase_transition(state, rng: random.Random, phase: str):
    if phase == "GROWTH":
        add_cluster(state, rng, rng.choice(["eastern", "western"]))
        state["growth_bias"]["x"] = clamp(state["growth_bias"]["x"] + 0.25, -1, 1)
    elif phase == "ENTANGLEMENT":
        ids = [node["id"] for node in state["nodes"]]
        for _ in range(max(2, len(ids) // 8)):
            add_connection(state, rng.choice(ids), rng.choice(ids), rng, orange=True)
        state["field_tension"] = clamp(state["field_tension"] + 0.25, 0.45, 1.8)
    elif phase == "SATURATION":
        state["palette_state"]["orange_ratio"] = clamp(state["palette_state"]["orange_ratio"] + 0.12, 0.06, 0.62)
        state["residue"] = clamp(state["residue"] + 0.16, 0, 1)
    elif phase == "FRACTURE":
        candidates = [edge for edge in state["connections"] if edge["damage"] < 0.95]
        for edge in rng.sample(candidates, min(len(candidates), max(2, len(candidates) // 10))):
            edge["damage"] = 1.0
        state["damage"] = clamp(state["damage"] + 0.24, 0, 1)
    elif phase == "REPAIR":
        repaired = 0
        for edge in state["connections"]:
            if edge["damage"] >= 0.95 and rng.random() < 0.55:
                edge["damage"] = rng.uniform(0.15, 0.45)
                repaired += 1
        state["damage"] = clamp(state["damage"] - 0.18, 0, 1)
        state["residue"] = clamp(state["residue"] + repaired * 0.01, 0, 1)
    elif phase == "REORIENTATION":
        state["drift_direction"]["x"], state["drift_direction"]["y"] = (
            -state["drift_direction"]["y"],
            state["drift_direction"]["x"],
        )
    else:
        state["drift_direction"] = {"x": rng.uniform(-0.25, 0.25), "y": rng.uniform(-0.25, 0.25)}


def maybe_anomaly(state, rng: random.Random):
    if rng.random() >= 0.025:
        return None
    anomaly_type = rng.choice(["fixed_orbit", "orange_lock", "silent_node", "directional_inversion", "persistent_residue"])
    anomaly = {
        "id": f"ANOM-{state['generation']:04d}-{len(state['anomalies']) + 1:02d}",
        "type": anomaly_type,
        "introduced_generation": state["generation"],
        "persistent": True,
    }
    if anomaly_type == "fixed_orbit" and state["nodes"]:
        target = rng.choice(state["nodes"])
        target["x_motion"] = max(target["x_motion"], 20)
        target["y_motion"] = max(target["y_motion"], 20)
        anomaly["target"] = target["id"]
    elif anomaly_type == "orange_lock" and state["connections"]:
        target = rng.choice(state["connections"])
        target["orange"] = True
        target["tension"] = max(1.6, target["tension"])
        anomaly["target"] = target["id"]
    elif anomaly_type == "silent_node" and state["nodes"]:
        target = rng.choice(state["nodes"])
        target["weight"] = 0.08
        target["scar"] = 1.0
        anomaly["target"] = target["id"]
    elif anomaly_type == "directional_inversion":
        state["drift_direction"]["x"] *= -1
        state["drift_direction"]["y"] *= -1
    else:
        state["residue"] = clamp(state["residue"] + 0.3, 0, 1)
    state["anomalies"].append(anomaly)
    return anomaly


def delta(current, previous, key):
    return float(current.get(key, 0)) - float(previous.get(key, 0))


def select_key_evolution(previous, current, mutation, phase_changed, anomaly):
    candidates = []
    node_delta = delta(current, previous, "node_count")
    cluster_delta = delta(current, previous, "cluster_count")
    connection_delta = delta(current, previous, "connection_count")
    connectivity_delta = delta(current, previous, "connectivity")
    residue_delta = delta(current, previous, "residue")
    damage_delta = delta(current, previous, "damage")
    speed_delta = delta(current, previous, "movement_speed")
    orange_delta = delta(current, previous, "orange_ratio")

    if anomaly:
        candidates.append((100, "anomaly_count", 1, "confirmed", f"Recovery Agents confirmed persistent anomaly {anomaly['id']} ({anomaly['type']}). Its altered rule has been retained in the generator genome and will influence subsequent executions."))
    if phase_changed:
        candidates.append((90, "phase_transition", current["phase"], "confirmed", f"Recovery Agents confirmed a developmental transition into {current['phase']}. Existing residue, scars, and altered rules remained intact during the reconfiguration."))
    if cluster_delta:
        direction = "formed" if cluster_delta > 0 else "collapsed"
        certainty = "confirmed" if abs(cluster_delta) >= 1 else "probable"
        candidates.append((80 + abs(cluster_delta), "cluster_count", cluster_delta, certainty, f"Recovery Agents {certainty} that {abs(int(cluster_delta))} field cluster{'s' if abs(cluster_delta) != 1 else ''} {direction}. The change is measurable in the inherited topology and is now affecting local connection density."))
    if node_delta:
        verb = "entered" if node_delta > 0 else "disappeared from"
        candidates.append((70 + abs(node_delta), "node_count", node_delta, "confirmed", f"Recovery Agents confirmed that {abs(int(node_delta))} node{'s' if abs(node_delta) != 1 else ''} {verb} the retained field. The current execution preserves the resulting boundary change."))
    if connection_delta or abs(connectivity_delta) > 0.004:
        direction = "increased" if connection_delta > 0 or connectivity_delta > 0 else "decreased"
        candidates.append((55 + abs(connection_delta), "connectivity", round(connectivity_delta, 4), "confirmed", f"Recovery Agents confirmed that field connectivity {direction}. The inherited network now contains {current['connection_count']} active connections across {current['node_count']} nodes."))
    if damage_delta > 0.025:
        candidates.append((60 + damage_delta * 10, "fragmentation", round(damage_delta, 3), "confirmed", "Recovery Agents confirmed a new fracture pattern. Broken connections remain recorded as damage rather than being removed, preserving the field's structural scars."))
    if residue_delta > 0.025:
        candidates.append((45 + residue_delta * 10, "residue", round(residue_delta, 3), "probable", "Recovery Agents observed a probable residue accumulation across the inherited field. The increase is concentrated around previously stressed nodes and damaged connections."))
    if abs(speed_delta) > 0.03:
        direction = "accelerated" if speed_delta > 0 else "slowed"
        candidates.append((35 + abs(speed_delta) * 10, "movement_speed", round(speed_delta, 3), "probable", f"Recovery Agents observed that the field's movement rule has {direction}. The change is consistent across the current execution but requires further runs to establish persistence."))
    if abs(orange_delta) > 0.012:
        direction = "toward orange annotation" if orange_delta > 0 else "toward phosphor signal"
        candidates.append((25 + abs(orange_delta) * 10, "palette_shift", round(orange_delta, 3), "speculative", f"Recovery Agents detected a speculative palette shift {direction}. The change is measurable but may reflect a temporary state response rather than a permanent rule change."))
    if mutation:
        candidates.append((20, mutation[0], mutation[1], "confirmed", f"Recovery Agents confirmed structural mutation {mutation[0].replace('_', ' ')}. The resulting rule and geometry have been written into the persistent genome."))
    if not candidates:
        candidates.append((1, "field_direction", current["field_direction"], "speculative", "Recovery Agents detected a subtle directional reorientation within the inherited field. The movement is measurable, though its developmental significance remains speculative."))
    _, change_type, value, certainty, text = max(candidates, key=lambda item: item[0])
    return {
        "key_change_type": change_type,
        "key_change_value": value,
        "key_change_certainty": certainty,
        "key_change_text": text,
    }


def evolve_state(parent_state, seed: int, generation: int, parent_id: str | None):
    rng = random.Random(seed)
    state = copy.deepcopy(parent_state)
    previous_metrics = calculate_metrics(state)
    state["generation"] = generation
    state["parent_archive_id"] = parent_id
    state["phase_age"] = int(state.get("phase_age", 0)) + 1
    mutations = []

    target_phase_index = ((generation - 1) // 24) % len(PHASES)
    phase_changed = target_phase_index != int(state.get("phase_index", 0))
    if phase_changed:
        state["phase_index"] = target_phase_index
        state["developmental_phase"] = PHASES[target_phase_index]
        state["phase_age"] = 0
        apply_phase_transition(state, rng, state["developmental_phase"])
        mutations.append({"scale": "phase", "type": "phase_transition", "value": state["developmental_phase"]})

    mutate_small(state, rng)
    mutations.append({"scale": "iteration", "type": "continuous_drift", "value": {"field_tension": round(state["field_tension"], 3), "movement_speed": round(state["movement_speed"], 3)}})

    structural = None
    if generation >= int(state.get("next_structural_generation", generation + 8)):
        mutation_type, details = structural_mutation(state, rng)
        structural = (mutation_type, details)
        mutations.append({"scale": "structural", "type": mutation_type, "value": details})

    anomaly = maybe_anomaly(state, rng)
    if anomaly:
        mutations.append({"scale": "anomaly", "type": anomaly["type"], "value": anomaly})

    current_metrics = calculate_metrics(state)
    key_change = select_key_evolution(previous_metrics, current_metrics, structural, phase_changed, anomaly)
    history_item = {
        "generation": generation,
        "parent_archive_id": parent_id,
        "phase": state["developmental_phase"],
        "mutations": mutations,
        "metrics_before": previous_metrics,
        "metrics_after": current_metrics,
        **key_change,
    }
    state["mutation_history"] = (state.get("mutation_history", []) + [history_item])[-96:]
    state["last_metrics"] = current_metrics
    return state, history_item, anomaly


def node_position(node, state, loop_phase: float):
    speed = state["movement_speed"]
    x = node["x"] + math.sin(loop_phase * speed + node["phase"]) * node["x_motion"]
    y = node["y"] + math.cos(loop_phase * speed + node["phase"]) * node["y_motion"]
    for field in state.get("secondary_fields", []):
        dx = x - field["x"]
        dy = y - field["y"]
        distance = max(1.0, math.hypot(dx, dy))
        influence = max(0.0, 1.0 - distance / field["radius"]) * field["strength"] * 12
        x += (-dy / distance) * influence * field["direction"]
        y += (dx / distance) * influence * field["direction"]
    return x, y


def render_frame(frame_index: int, seed: int, state, fonts):
    header_font, body_font, small_font = fonts
    loop_phase = math.tau * frame_index / FRAME_COUNT
    base = Image.new("RGBA", (WIDTH, HEIGHT), BG)
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    crisp = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    scan = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    base_draw = ImageDraw.Draw(base)
    glow_draw = ImageDraw.Draw(glow)
    crisp_draw = ImageDraw.Draw(crisp)
    scan_draw = ImageDraw.Draw(scan)

    palette = state["palette_state"]
    phosphor_alpha = palette["phosphor_energy"]
    for band in range(10):
        points = []
        base_y = 84 + band * 62
        amplitude = (6 + (band % 4) * 3) * state["field_tension"]
        for x in range(0, WIDTH + 1, 18):
            y = base_y + math.sin(x * 0.012 + loop_phase + band * 0.42 + state["residue"] * 2) * amplitude
            points.append((x, y))
        crisp_draw.line(points, fill=(216, 221, 211, int(10 + state["residue"] * 16)), width=1)

    nodes = node_map(state)
    positions = {node_id: node_position(node, state, loop_phase) for node_id, node in nodes.items()}
    for edge in state["connections"]:
        if edge["damage"] >= 0.95:
            continue
        p0 = positions[edge["a"]]
        p2 = positions[edge["b"]]
        pulse = 0.5 + 0.5 * math.sin(loop_phase * 2 + edge["phase"])
        color = ORANGE if edge["orange"] else PHOSPHOR
        damage_fade = 1.0 - edge["damage"] * 0.7
        p1 = (
            edge["curve_x"] + math.sin(loop_phase + edge["phase"]) * 10 * edge["tension"],
            edge["curve_y"] + math.cos(loop_phase + edge["phase"]) * 10 * edge["tension"],
        )
        draw_curve(glow_draw, p0, p1, p2, (color[0], color[1], color[2], int((24 + pulse * 34) * damage_fade)), width=5)
        draw_curve(crisp_draw, p0, p1, p2, (color[0], color[1], color[2], int((78 + pulse * 112) * damage_fade)), width=1)

    for node_id, node in nodes.items():
        x, y = positions[node_id]
        pulse = 0.5 + 0.5 * math.sin(loop_phase * 2 + node["phase"])
        radius = 2.5 + node["weight"] * 4.2 + pulse * 1.6 + node["scar"] * 2
        orange_bias = node["weight"] > 0.82 and pulse > 0.65
        color = ORANGE if orange_bias else PHOSPHOR
        alpha = int(220 * phosphor_alpha * (0.65 + node["weight"] * 0.35))
        bounds = (x - radius, y - radius, x + radius, y + radius)
        glow_draw.ellipse((bounds[0] - 3, bounds[1] - 3, bounds[2] + 3, bounds[3] + 3), fill=(color[0], color[1], color[2], 42))
        crisp_draw.ellipse(bounds, fill=(color[0], color[1], color[2], clamp(alpha, 30, 255)))
        if node["scar"] > 0.35:
            crisp_draw.line((x - 5, y - 5, x + 5, y + 5), fill=(255, 104, 28, 150), width=1)

    band_center = int((frame_index / FRAME_COUNT) * (HEIGHT + 120)) - 60
    for offset in range(-32, 33):
        alpha = int(clamp(24 - abs(offset) * 0.75, 0, 24))
        y = band_center + offset
        if 0 <= y < HEIGHT:
            scan_draw.line((0, y, WIDTH, y), fill=(255, 104, 28, alpha), width=1)

    base_draw.rectangle((18, 18, WIDTH - 18, HEIGHT - 18), outline=(255, 104, 28, 86), width=1)
    base_draw.line((18, 64, WIDTH - 18, 64), fill=(216, 221, 211, 30), width=1)
    base_draw.line((18, HEIGHT - 56, WIDTH - 18, HEIGHT - 56), fill=(216, 221, 211, 20), width=1)
    base_draw.text((34, 32), "FIELD STATION: MAGPIE / M3RØ", font=header_font, fill=ORANGE)
    base_draw.text((34, 84), f"SIGNAL LINEAGE / {state['developmental_phase']}", font=body_font, fill=PAPER)
    base_draw.text((WIDTH - 198, 32), f"GEN {state['generation']:04d} / {frame_index + 1:03d}", font=small_font, fill=MUTED)
    base_draw.rectangle((34, HEIGHT - 42, 250, HEIGHT - 24), outline=(216, 221, 211, 26), width=1)
    base_draw.rectangle((268, HEIGHT - 42, 540, HEIGHT - 24), outline=(216, 221, 211, 26), width=1)
    base_draw.rectangle((558, HEIGHT - 42, WIDTH - 34, HEIGHT - 24), outline=(216, 221, 211, 26), width=1)
    base_draw.text((42, HEIGHT - 39), f"SEED {seed}", font=small_font, fill=MUTED)
    base_draw.text((276, HEIGHT - 39), f"NODES {len(state['nodes'])} / LINKS {len(state['connections'])}", font=small_font, fill=MUTED)
    base_draw.text((566, HEIGHT - 39), f"DAMAGE {state['damage']:.2f} / RESIDUE {state['residue']:.2f}", font=small_font, fill=MUTED)

    glow = glow.filter(ImageFilter.GaussianBlur(radius=4))
    frame = Image.alpha_composite(base, glow)
    frame = Image.alpha_composite(frame, crisp)
    frame = Image.alpha_composite(frame, scan)
    return frame.convert("RGB")


def encode_video(frame_directory: Path, output_path: Path):
    subprocess.run(
        [
            "ffmpeg", "-y", "-framerate", str(FPS), "-start_number", "0",
            "-i", str(frame_directory / "frame_%04d.png"),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-crf", "22", "-preset", "medium", str(output_path),
        ],
        check=True,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--thumbnail", type=Path, required=True)
    parser.add_argument("--state-in", type=Path)
    parser.add_argument("--state-out", type=Path, required=True)
    parser.add_argument("--metadata-out", type=Path, required=True)
    parser.add_argument("--generation", type=int, required=True)
    parser.add_argument("--execution-id", required=True)
    parser.add_argument("--parent-id")
    parser.add_argument("--parent-seed", type=int)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.thumbnail.parent.mkdir(parents=True, exist_ok=True)
    parent_state = load_json(args.state_in)
    if parent_state is None:
        bootstrap_seed = args.parent_seed if args.parent_seed is not None else args.seed
        parent_state = initialize_state(bootstrap_seed, args.generation, args.parent_id)

    state, evolution, anomaly = evolve_state(parent_state, args.seed, args.generation, args.parent_id)
    fonts = load_fonts()
    with tempfile.TemporaryDirectory() as temporary_directory:
        frame_directory = Path(temporary_directory)
        poster = None
        for frame_index in range(FRAME_COUNT):
            frame = render_frame(frame_index, args.seed, state, fonts)
            frame.save(frame_directory / f"frame_{frame_index:04d}.png", format="PNG")
            if frame_index == FRAME_COUNT // 2:
                poster = frame.copy()
        if poster is None:
            poster = render_frame(FRAME_COUNT // 2, args.seed, state, fonts)
        poster.save(args.thumbnail, format="JPEG", quality=91, optimize=True)
        encode_video(frame_directory, args.output)

    state["current_archive_id"] = args.execution_id
    state["parent_archive_id"] = args.parent_id
    save_json(args.state_out, state)
    metadata = {
        "title": f"Field Station Signal Loop / G{args.generation:04d} — {state['developmental_phase']}",
        "lineage_generation": args.generation,
        "parent_archive_id": args.parent_id,
        "developmental_phase": state["developmental_phase"],
        "topology": state["topology"],
        "node_count": len(state["nodes"]),
        "connection_rules": state["connection_rules"],
        "field_tension": round(state["field_tension"], 3),
        "drift_direction": state["drift_direction"],
        "growth_bias": state["growth_bias"],
        "damage": round(state["damage"], 3),
        "residue": round(state["residue"], 3),
        "anomalies": state["anomalies"],
        "palette_state": state["palette_state"],
        "mutation_history": evolution["mutations"],
        "metrics_before": evolution["metrics_before"],
        "metrics_after": evolution["metrics_after"],
        "key_change_type": evolution["key_change_type"],
        "key_change_value": evolution["key_change_value"],
        "key_change_certainty": evolution["key_change_certainty"],
        "key_change_text": evolution["key_change_text"],
        "event_log": anomaly,
    }
    save_json(args.metadata_out, metadata)


if __name__ == "__main__":
    main()
