"""
Workout session logger for saving and exporting workout data
"""
import json
import csv
from datetime import datetime
from pathlib import Path


class WorkoutLogger:
    """Logger for workout sessions and statistics"""
    
    def __init__(self, data_dir='workout_data'):
        """
        Initialize workout logger
        
        Args:
            data_dir: Directory to store workout data
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.sessions_file = self.data_dir / 'sessions.json'
        self.current_session = None
        
        # Load existing sessions
        self.sessions = self._load_sessions()
    
    def _load_sessions(self):
        """Load workout sessions from JSON file"""
        if self.sessions_file.exists():
            try:
                with open(self.sessions_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return []
        return []
    
    def _save_sessions(self):
        """Save all sessions to JSON file"""
        with open(self.sessions_file, 'w', encoding='utf-8') as f:
            json.dump(self.sessions, f, indent=2, ensure_ascii=False)
    
    def start_session(self, exercise_type, exercise_name):
        """
        Start a new workout session
        
        Args:
            exercise_type: Exercise type ID (1-5)
            exercise_name: Exercise name string
        """
        self.current_session = {
            'id': len(self.sessions) + 1,
            'exercise_type': exercise_type,
            'exercise_name': exercise_name,
            'start_time': datetime.now().isoformat(),
            'end_time': None,
            'duration_seconds': 0,
            'reps': 0,
            'metrics': {}
        }
    
    def update_session(self, reps=None, metrics=None):
        """
        Update current session data
        
        Args:
            reps: Number of reps completed
            metrics: Additional metrics (dict)
        """
        if self.current_session:
            if reps is not None:
                self.current_session['reps'] = reps
            if metrics:
                self.current_session['metrics'].update(metrics)
    
    def end_session(self):
        """End current session and save to history"""
        if self.current_session:
            # Calculate duration
            start = datetime.fromisoformat(self.current_session['start_time'])
            end = datetime.now()
            self.current_session['end_time'] = end.isoformat()
            self.current_session['duration_seconds'] = int((end - start).total_seconds())
            
            # Add to sessions list
            self.sessions.append(self.current_session)
            
            # Save to file
            self._save_sessions()
            
            # Reset current session
            session_copy = self.current_session.copy()
            self.current_session = None
            
            return session_copy
        return None
    
    def get_sessions(self, exercise_type=None, limit=None):
        """
        Get workout sessions
        
        Args:
            exercise_type: Filter by exercise type (optional)
            limit: Maximum number of sessions to return (optional)
            
        Returns:
            list: List of session dictionaries
        """
        sessions = self.sessions
        
        # Filter by exercise type
        if exercise_type is not None:
            sessions = [s for s in sessions if s['exercise_type'] == exercise_type]
        
        # Sort by date (newest first)
        sessions = sorted(sessions, key=lambda x: x['start_time'], reverse=True)
        
        # Limit results
        if limit:
            sessions = sessions[:limit]
        
        return sessions
    
    def get_statistics(self, exercise_type=None):
        """
        Calculate workout statistics
        
        Args:
            exercise_type: Filter by exercise type (optional)
            
        Returns:
            dict: Statistics dictionary
        """
        sessions = self.get_sessions(exercise_type=exercise_type)
        
        if not sessions:
            return {
                'total_sessions': 0,
                'total_reps': 0,
                'total_duration': 0,
                'average_reps': 0,
                'average_duration': 0,
                'best_reps': 0
            }
        
        total_reps = sum(s['reps'] for s in sessions)
        total_duration = sum(s['duration_seconds'] for s in sessions)
        
        return {
            'total_sessions': len(sessions),
            'total_reps': total_reps,
            'total_duration': total_duration,
            'average_reps': round(total_reps / len(sessions), 1),
            'average_duration': round(total_duration / len(sessions), 1),
            'best_reps': max(s['reps'] for s in sessions),
            'last_workout': sessions[0]['start_time'] if sessions else None
        }
    
    def export_to_csv(self, filename=None):
        """
        Export sessions to CSV file
        
        Args:
            filename: Output CSV filename (optional)
            
        Returns:
            str: Path to created CSV file
        """
        if filename is None:
            filename = f'workout_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        csv_path = self.data_dir / filename
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            if self.sessions:
                # Get all unique keys from sessions
                fieldnames = ['id', 'exercise_name', 'start_time', 'end_time', 
                             'duration_seconds', 'reps']
                
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for session in self.sessions:
                    # Write basic fields
                    row = {k: session.get(k, '') for k in fieldnames}
                    writer.writerow(row)
        
        return str(csv_path)
    
    def clear_history(self):
        """Clear all workout history"""
        self.sessions = []
        self._save_sessions()
