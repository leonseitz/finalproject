from app.core.database import SessionLocal
from app.models.exercise_type import Fitness

def seed_fitness():
    exercises = [
        "Bicep Curls",
        "Squats",
        "Push-up",
        "Pull-up",
        "Plank"
    ]
    
    db = SessionLocal()
    try:
        # Check if already seeded
        count = db.query(Fitness).count()
        if count > 0:
            print(f"Database already has {count} fitness types. Skipping seeding.")
            return

        print("Seeding fitness types...")
        for name in exercises:
            fitness = Fitness(fit_name=name)
            db.add(fitness)
        
        db.commit()
        print("Successfully seeded 5 fitness types.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_fitness()
