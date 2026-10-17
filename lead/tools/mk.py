# FOLDERS: this tool reads LEAD_SCRATCH (the lead's working folder; default: a `scratch/` folder next to the repo,
# i.e. <repo>/../scratch). Task briefs are written to $LEAD_SCRATCH/prompts/. The templates and common-rules.md sit
# beside this file; {SCRATCH} in them is replaced by the resolved LEAD_SCRATCH, {SESSION_URL} by LEAD_SESSION_URL.
import os, sys
# usage: mk.py b|v ID "TITLE" BUDGET "PORTS" STAMP "EXTRA" [FROMNOTE] [SUFFIX]
kind,ID,TITLE,BUDGET,PORTS,STAMP,EXTRA=sys.argv[1:8]; FROM=sys.argv[8] if len(sys.argv)>8 else ''
HERE=os.path.dirname(os.path.abspath(__file__))                       # .../lead/tools
REPO=os.path.dirname(os.path.dirname(HERE))                           # the repo root
SCRATCH=os.path.abspath(os.environ.get('LEAD_SCRATCH') or os.path.join(os.path.dirname(REPO),'scratch'))
SESSION=os.environ.get('LEAD_SESSION_URL') or 'https://claude.ai/code/session_01YVWyVbutb6jEWsPXBkYeY9'
P=os.path.join(SCRATCH,'prompts')+'/'
os.makedirs(P,exist_ok=True)
common=dict(SCRATCH=SCRATCH,SESSION_URL=SESSION)
def fill(t,d):
    t=''.join(l for l in t.splitlines(True) if not l.startswith('#LEADNOTE'))
    for k,v in d.items(): t=t.replace('{'+k+'}',v)
    return t
# the rules every agent reads, rendered with this machine's scratch folder
open(P+'common-rules.md','w').write(fill(open(os.path.join(HERE,'common-rules.md')).read(),common))
t=open(os.path.join(HERE,f'{kind}-TASK.tmpl')).read()
t=fill(t,dict(common,ID=ID,TITLE=TITLE,BUDGET=BUDGET,PORTS=PORTS,STAMP=STAMP,EXTRA=('\n'+EXTRA+'\n') if EXTRA else '',low=ID.lower(),stk=ID.lower().replace('-','_'),FROMNOTE=FROM))
out=P+f'{kind}-{ID}{"-"+sys.argv[9] if len(sys.argv)>9 else ""}.txt'
open(out,'w').write(t); print(out)
