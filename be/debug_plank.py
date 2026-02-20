
import json
import time
from app.services.plank_tracker import PlankTracker

def test_plank_summary():
    print("Initializing PlankTracker...")
    tracker = PlankTracker()
    tracker.reset()
    tracker.is_tracking = True
    
    # Simulate some time passing
    tracker.plank_start_time = time.time() - 60 # 60 seconds ago
    tracker.elapsed_time = 60
    
    # Simulate a pause
    tracker.pause_count = 1
    
    # Add some feedback
    tracker.add_feedback("Hips", "Too high")
    
    print("Getting Session Summary...")
    summary = tracker.get_session_summary()
    
    print("\nSummary Output:")
    print(json.dumps(summary, indent=2))
    
    # Verify structure matches upload_video expectations
    print("\nVerifying Structure...")
    
    # 1. Total Score present?
    if "total_score" in summary:
        print("✅ total_score present")
    else:
        print("❌ total_score MISSING")
        
    # 2. Reps History present?
    if "reps_history" in summary and isinstance(summary["reps_history"], list) and len(summary["reps_history"]) > 0:
        print("✅ reps_history present and not empty")
        rep = summary["reps_history"][0]
        
        # 3. Rep Content
        required_keys = ["rep_number", "score", "duration", "warning_count", "feedbacks"]
        missing = [k for k in required_keys if k not in rep]
        if not missing:
            print("✅ Rep structure valid")
        else:
            print(f"❌ Rep structure missing keys: {missing}")
            
        # 4. Feedback Content
        if "feedbacks" in rep and isinstance(rep["feedbacks"], list) and len(rep["feedbacks"]) > 0:
            fb = rep["feedbacks"][0]
            fb_keys = ["body_part", "issue", "timestamp"]
            missing_fb = [k for k in fb_keys if k not in fb]
            if not missing_fb:
                print("✅ Feedback structure valid")
            else:
                 print(f"❌ Feedback structure missing keys: {missing_fb}")
        else:
            print("⚠️ No feedbacks to verify structure (expected given add_feedback called)")

    else:
        print("❌ reps_history MISSING or EMPTY")

if __name__ == "__main__":
    test_plank_summary()
