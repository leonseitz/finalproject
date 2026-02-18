from sqlalchemy import inspect, text
from app.core.database import engine

def show_table_structure():
    inspector = inspect(engine)
    
    with open("database_structure.txt", "w", encoding="utf-8") as f:
        for table_name in inspector.get_table_names():
            f.write(f"\n{'='*60}\n")
            f.write(f"Table: {table_name}\n")
            f.write(f"{'='*60}\n")
            
            columns = inspector.get_columns(table_name)
            f.write(f"Columns ({len(columns)}):\n")
            for col in columns:
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                f.write(f"  - {col['name']}: {col['type']} {nullable}\n")
            
            # Foreign Keys
            fks = inspector.get_foreign_keys(table_name)
            if fks:
                f.write(f"\nForeign Keys ({len(fks)}):\n")
                for fk in fks:
                    f.write(f"  - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}\n")
            
            # Primary Keys
            pk = inspector.get_pk_constraint(table_name)
            if pk and pk['constrained_columns']:
                f.write(f"\nPrimary Key: {', '.join(pk['constrained_columns'])}\n")
    
    print("Database structure saved to: database_structure.txt")

if __name__ == "__main__":
    show_table_structure()
