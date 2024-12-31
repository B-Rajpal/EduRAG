import os

def preview_subject_files(base_folder):
    for subject in os.listdir(base_folder):
        subject_folder = os.path.join(base_folder, subject)
        if os.path.isdir(subject_folder):
            print(f"\nSubject: {subject}")
            files = os.listdir(subject_folder)
            if files:
                for file in files:
                    print(f"  - {file}")
            else:
                print("  No files available.")
