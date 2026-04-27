import os
import pandas as pd

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_CSV = os.path.join(ROOT_DIR, "dataset.csv")
OUTPUT_CSV = os.path.join(ROOT_DIR, "dataset_clean.csv")

def main():
    print("Loading original dataset...")
    df = pd.read_csv(INPUT_CSV)

    # ── Realistic IT Names ──
    realistic_categories = [
        'Network', 'Hardware', 'Software', 'Database', 'Security', 
        'Cloud/Infrastructure', 'Access/Identity', 'ERP System', 
        'Email/Communication', 'Telephony', 'Web Services', 'Data Storage'
    ]
    
    realistic_groups = [
        'Network Team', 'Hardware Support', 'DBA Team', 'Security Operations', 
        'Cloud Infra', 'Helpdesk L1', 'Helpdesk L2', 'SysAdmin', 
        'SAP Team', 'Identity Management', 'Vendor Support', 'Data Center Ops'
    ]
    
    realistic_subcats = [
        'Router', 'Switch', 'Laptop', 'Monitor', 'Oracle DB', 'SQL Server', 
        'VPN', 'Active Directory', 'SAP Module', 'Outlook', 'Firewall', 
        'Server OS', 'Storage Array', 'Mobile Device', 'Printer', 'VoIP Phone'
    ]

    # Create mappings for unique values
    def map_values(series, names_list):
        unique_vals = [v for v in series.unique() if pd.notna(v) and v != '?']
        mapping = {'?': 'Unknown'}
        for i, val in enumerate(unique_vals):
            # Append a number if we cycle through to keep them unique-ish, or just cycle
            base = names_list[i % len(names_list)]
            suffix = f" {i // len(names_list) + 1}" if i >= len(names_list) else ""
            mapping[val] = f"{base}{suffix}"
        return mapping

    print("Mapping categories...")
    cat_map = map_values(df['category'], realistic_categories)
    df['category'] = df['category'].map(cat_map).fillna('Unknown')

    print("Mapping subcategories...")
    sub_map = map_values(df['subcategory'], realistic_subcats)
    df['subcategory'] = df['subcategory'].map(sub_map).fillna('Unknown')

    print("Mapping assignment groups...")
    grp_map = map_values(df['assignment_group'], realistic_groups)
    df['assignment_group'] = df['assignment_group'].map(grp_map).fillna('Unknown')

    print(f"Saving to {OUTPUT_CSV}...")
    df.to_csv(OUTPUT_CSV, index=False)
    print("✅ Clean dataset generated successfully.")

if __name__ == "__main__":
    main()
