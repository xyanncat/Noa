import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from memory.manager import memory_manager
from tools.base import tool_registry
from internet.search import web_search_engine
from core.orchestrator import orchestrator
from agents.autonomous_agent import autonomous_agent

def run_tests():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("=== Testing Noa Autonomous AI Engine ===")
    
    # 1. Test Tools Registry
    tools = tool_registry.list_tools()
    print(f"[OK] Registered Tools ({len(tools)} total): {[t['name'] for t in tools]}")
    assert len(tools) >= 9, "Expected at least 9 registered tools"

    # 2. Test Memory Layers
    print("\n--- Testing 5 Memory Layers ---")
    memory_manager.long_term.add_preference("theme", "Dark Glassmorphism")
    memory_manager.long_term.add_goal("master_ai", "Build autonomous AI engine Noa")
    memory_manager.semantic.add_fact("Noa", "Noa is a friendly autonomous AI with 5 memory layers")
    memory_manager.episodic.log_event("session_test", "test_run", "Executed test suite for Noa")
    
    snapshot = memory_manager.inspect_all()
    print(f"[OK] Long-Term Memories: {len(snapshot['long_term'])}")
    print(f"[OK] Semantic Memories: {len(snapshot['semantic'])}")
    print(f"[OK] Episodic Events: {len(snapshot['episodic'])}")

    # 3. Test Internet Module
    print("\n--- Testing Internet Search Module ---")
    search_res = web_search_engine.search("Autonomous AI agents 2026")
    print(f"[OK] Internet Search Result: {search_res[0]['title']}")

    # 4. Test Multi-Step Orchestration
    print("\n--- Testing Noa Pipeline (Query -> Plan -> Execution -> Response) ---")
    query = "Check the weather in Tokyo and tell me about my long term goals."
    output = orchestrator.process_request(query)
    
    print(f"\nUser Query: '{query}'")
    print(f"Goal Identified: '{output['plan']['goal']}'")
    print(f"Steps Planned: {len(output['plan']['steps'])}")
    for step in output['plan']['steps']:
        print(f"  - Step {step['step_number']}: {step['description']} (Tool: {step['tool_name']})")
    print(f"\nFinal Noa Response:\n{output['response']}")

    # 5. Test Autonomous Agent Tasks
    print("\n--- Testing Autonomous Agent Tasks ---")
    task_id = autonomous_agent.create_reminder("Review Noa Dashboard", "2026-07-30 18:00")
    print(f"[OK] Created Autonomous Task ID: {task_id}")

    print("\n[SUCCESS] All core tests passed cleanly for Noa!")

if __name__ == "__main__":
    run_tests()
