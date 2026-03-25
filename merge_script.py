import subprocess
import os
import sys

def run(cmd):
    return subprocess.run(cmd, shell=True, text=True, capture_output=True)

# make sure git doesn't prompt for commit messages
os.environ["GIT_MERGE_AUTOEDIT"] = "no"

res = run("git branch -r --no-merged HEAD | grep origin/ | grep -v 'origin/main$' | grep -v 'origin/HEAD$'")
branches = [b.strip() for b in res.stdout.split('\n') if b.strip()]

for b in branches:
    print(f"Merging {b} ...")
    merge_res = run(f"git merge {b} -m 'Merge {b}'")
    if merge_res.returncode != 0:
        print(f"Conflict with {b}, attempting -X ours...")
        run("git merge --abort")
        merge_res2 = run(f"git merge -X ours {b} -m 'Merge {b} with ours'")
        if merge_res2.returncode != 0:
            print(f"Failed to merge {b} even with -X ours. Checking for binary DB conflicts...")
            
            diff_res = run("git diff --name-only --diff-filter=U")
            conflicts = [f.strip() for f in diff_res.stdout.split('\n') if f.strip()]
            
            if len(conflicts) > 0:
                print(f"Resolving conflicts automatically by taking --ours for all...")
                run("git checkout --ours .")
                run("git add -A")
                commit_res = run(f"git commit -m 'Merge {b} with ours'")
                if commit_res.returncode != 0:
                     print(f"Failed to commit {b}. Skipping!")
                     run("git merge --abort")
                else:
                     print(f"Successfully merged {b} via manual --ours checkout.")
            else:
                run("git merge --abort")
    else:
        print(f"Successfully merged {b}")

print("Merge script finished.")
