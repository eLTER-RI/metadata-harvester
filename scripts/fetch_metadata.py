import requests
import json
import sys
import os

def fetch_all_links():
    base_url = "https://b2share.eudat.eu/api/records/?q=community:d952913c-451e-4b5c-817e-d578dc8a4469&sort=oldest&size=1123"
    page = 1
    links = []
    
    response = requests.get(base_url)
    
    if response.status_code != 200:
        print(f"Error: Received status code {response.status_code}")
        return []
    
    data = response.json()
    hits = data.get("hits", {}).get("hits", [])
    
    if not hits:
        print(f"Error: Received status code {response.status_code}")
        return []
    
    links.extend(record["links"]["self"] for record in hits if "links" in record and "self" in record["links"])
    
    return links

def fetch_subfield(links, subfield):
    results = {}
    for link in links:
        response = requests.get(link)
        if response.status_code == 200:
            data = response.json()
            results[link] = data.get("metadata", {}).get(subfield, None)
        else:
            print(f"Error fetching {link}: Status code {response.status_code}")
    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fetch_metadata.py <subfield> [output_filename]")
        sys.exit(1)

    subfield = sys.argv[1]
    output_filename = sys.argv[2] if len(sys.argv) >= 3 else f"pulled_data/b2share_{subfield}.json"

    output_dir = os.path.dirname(output_filename)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    all_links = fetch_all_links()
    subfield_data = fetch_subfield(all_links, subfield)

    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(subfield_data, f, indent=4, ensure_ascii=False)

    print(f'Subfield "{subfield}" data saved to {output_filename}')

