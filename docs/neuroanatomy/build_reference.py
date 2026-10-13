#!/usr/bin/env python3
"""Build and validate the local editorial reference. No application files are changed.
Requires Python 3 and Node with the project's installed TypeScript dependency.
"""
import argparse
import collections
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
PARTS = ['systems', 'cortex', 'deep-and-functional', 'supporting-structures', 'brodmann', 'pathways']
TEXT_FIELDS = ['anatomy','function','connections','clinical','laterality','limitations']
MAPPING_FIELDS = ['projectRegionIds','projectStructureIds','projectCircuitIds','projectHierarchyIds','projectSpatialAnchorIds']
TITLES = {'cortex':'Kora: zakręty, bruzdy i punkty orientacyjne', 'deep-and-functional':'Struktury głębokie, układy czynnościowe, pień i móżdżek', 'brodmann':'Pola Brodmanna 1–52', 'pathways':'Drogi, pęczki, projekcje i obwody'}
TITLES.update({'systems':'Główne części mózgowia i układy', 'supporting-structures':'Dodatkowe struktury schematów'})
LABELS = {'anatomy':'Anatomia i topografia','function':'Funkcja i mechanizm','connections':'Połączenia: wejścia i wyjścia','route':'Przebieg krok po kroku','decussation':'Skrzyżowania i strona objawów','transmitters':'Neuroprzekaźniki','clinical':'Znaczenie kliniczne','laterality':'Lateralizacja','limitations':'Granice interpretacji','evidenceNote':'Charakter dowodów','evidenceNotes':'Charakter dowodów'}

def dump(x):
    return json.dumps(x,ensure_ascii=False,indent=2)+'\n'

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
    inventory=json.loads(subprocess.check_output([os.environ.get('BRAIN_ATLAS_NODE','node'),str(HERE/'inventory.mjs')],cwd=ROOT,text=True))
    sources=json.loads((HERE/'sources.json').read_text())
    source_by_id={s['id']:s for s in sources}
    if len(source_by_id)!=len(sources):raise ValueError('Powtórzony identyfikator źródła')
    grouped={p:json.loads((HERE/'parts'/f'{p}.json').read_text()) for p in PARTS}
    entries=[e for p in PARTS for e in grouped[p]]
    ids=[e['id'] for e in entries]
    if len(ids)!=len(set(ids)):raise ValueError('Powtórzony identyfikator artykułu')
    entry_by_id={e['id']:e for e in entries}
    for e in entries:
        e.setdefault('projectHierarchyIds',[])
        e.setdefault('projectSpatialAnchorIds',[])
    spatial_index=json.loads((HERE/'spatial-index.json').read_text())
    anchor_ids=[r['anchorId'] for r in spatial_index]
    if len(anchor_ids)!=len(set(anchor_ids)):raise ValueError('Powtórzony węzeł w indeksie przestrzennym')
    for record in spatial_index:
        if not record.get('scope'):raise ValueError('Brak zakresu odsyłacza przestrzennego')
        article=entry_by_id[record['articleId']]
        if record['anchorId'] not in article['projectSpatialAnchorIds']:
            article['projectSpatialAnchorIds'].append(record['anchorId'])
    expected={'projectRegionIds':{r['id'] for r in inventory['atlasRegions']},'projectStructureIds':set(inventory['structureIds']),'projectCircuitIds':{c['id'] for c in inventory['circuits']},'projectHierarchyIds':{n['id'] for n in inventory['hierarchy']},'projectSpatialAnchorIds':set(inventory['spatialAnchors'])}
    if set(anchor_ids)!=expected['projectSpatialAnchorIds']:raise ValueError('Indeks przestrzenny nie odpowiada katalogowi projektu')
    mapping={f:collections.defaultdict(list) for f in MAPPING_FIELDS}
    for e in entries:
        if not re.fullmatch(r'[A-Za-z0-9_.-]+',e['id']):raise ValueError(f'Niepoprawny ID: {e["id"]}')
        for n in ['pl','en','lat']:
            if not e.get('names',{}).get(n):raise ValueError(f'Brak nazwy {n}: {e["id"]}')
        for f in TEXT_FIELDS:
            if not isinstance(e.get(f),str) or not e[f].strip():raise ValueError(f'Brak pola {f}: {e["id"]}')
        for f in MAPPING_FIELDS:
            if not isinstance(e.get(f),list):raise ValueError(f'Brak listy {f}: {e["id"]}')
            for pid in e[f]:
                if pid not in expected[f]:raise ValueError(f'Nieznany {f}: {pid}')
                mapping[f][pid].append(e['id'])
        for f,principal in [('relatedStructureIds','projectStructureIds'),('relatedCircuitIds','projectCircuitIds')]:
            if not isinstance(e.get(f,[]),list):raise ValueError(f'Niepoprawna lista {f}: {e["id"]}')
            for pid in e.get(f,[]):
                if pid not in expected[principal]:raise ValueError(f'Nieznany {f}: {pid}')
        if not e.get('sources'):raise ValueError(f'Brak źródeł: {e["id"]}')
        for ref in e['sources']:
            if ref['sourceId'] not in source_by_id:raise ValueError(f'Nieznane źródło {ref["sourceId"]}: {e["id"]}')
            if not ref.get('locator'):raise ValueError(f'Brak lokalizatora: {e["id"]}')
        if e['category']=='pathway':
            for f in ['route','decussation','transmitters']:
                if not e.get(f):raise ValueError(f'Brak {f}: {e["id"]}')
    missing={f:sorted(expected[f]-set(mapping[f])) for f in MAPPING_FIELDS}
    if any(missing.values()):raise ValueError(f'Niepełne pokrycie: {missing}')
    # A model/function/circuit ID must have one principal article, avoiding ambiguous integration.
    ambiguous={f:{k:v for k,v in mapping[f].items() if len(v)!=1} for f in MAPPING_FIELDS}
    if any(ambiguous.values()):raise ValueError(f'Wieloznaczne mapowanie: {ambiguous}')
    actual_ba=sorted(e['number'] for e in grouped['brodmann'])
    if actual_ba!=sorted(inventory['brodmannNumbers']):raise ValueError('Niepełny katalog numerów Brodmanna')
    counts={'articles':len(entries),'atlasRegions':len(expected['projectRegionIds']),'functionalCards':len(expected['projectStructureIds']),'existingCircuits':len(expected['projectCircuitIds']),'brodmannNumbers':len(actual_ba),'parts':{p:len(grouped[p]) for p in PARTS},'supplementaryPathways':sum(not e['projectCircuitIds'] for e in grouped['pathways'])}
    counts.update({'hierarchyNodes':len(expected['projectHierarchyIds']),'spatialAnchors':len(expected['projectSpatialAnchorIds']),'sources':len(sources)})
    counts['wordsInContent']=sum(len(e.get(f,'').split()) for e in entries for f in LABELS if isinstance(e.get(f,''),str))
    coverage={'schemaVersion':1,'date':'2026-10-13','counts':counts,'missing':missing,'ambiguous':ambiguous,'projectSourceHashes':inventory['sourceHashes'],'mapping':{f:dict(sorted(mapping[f].items())) for f in MAPPING_FIELDS},'brodmannNumbers':actual_ba,'validationScope':'Pokrycie identyfikatorów, kompletność pól, jednoznaczność mapowania, obecność źródeł i powtarzalność eksportu. Walidacja techniczna nie jest recenzją kliniczną.'}
    dataset={'schemaVersion':1,'language':'pl','date':'2026-10-13','status':'editorial_reference_not_externally_peer_reviewed','scope':'Istniejące regiony, karty i obwody projektu plus jawnie oznaczone uzupełnienia. Artykuł może wspólnie opisywać homologiczne regiony L/P.','counts':counts,'entries':entries,'sources':sources}
    dataset['spatialIndexNotes']=spatial_index
    md=['# Neuroatlas: anatomia, czynność i klinika mózgowia','',f'Polska baza opisowa projektu. Stan katalogu: 13 października 2026. {counts["articles"]} artykułów; {counts["atlasRegions"]} identyfikatorów atlasu, {counts["functionalCards"]} kart funkcjonalnych, {counts["existingCircuits"]} istniejące obwody i {counts["supplementaryPathways"]} dodatkowych dróg/układów.','',
        'Opisy są opracowaniem edukacyjnym. Łączą anatomię, mechanizm, przebieg połączeń i konsekwencje uszkodzeń. Lewa i prawa parcela mogą mieć wspólną kartę z osobną informacją o lateralizacji. Opis szerszej sieci nie dowodzi swoistej funkcji pojedynczej etykiety. Materiał nie przeszedł zewnętrznej recenzji klinicznej.','',
        'Nazwy PL/EN/LAT i ID umożliwiają połączenie z aplikacją. Rozróżniono pęczek aksonów, projekcję, obwód wielosynaptyczny, sieć funkcjonalną i oś hormonalną. Numery stron PDF liczone są od pierwszej strony pliku; numery tablic i stron drukowanych podano oddzielnie, gdy zostały sprawdzone.','',
        f'Dodatkowo opisano {counts["hierarchyNodes"]} grup nadrzędnych i przyporządkowano do artykułów pełny zestaw {counts["spatialAnchors"]} nazwanych węzłów schematów. Drobne jądro może być omówione wewnątrz większej struktury lub odpowiedniej drogi. Węzły poza mózgowiem i mikroukłady komórkowe zachowują odrębny charakter. Odsyłacz do tekstu nie wyznacza granic geometrycznych.','',
        'Zobacz również [zasady interpretacji i lokalizacji klinicznej](PRZEWODNIK.md), [opis pakietu i uwagi redakcyjne](README.md) oraz [pełną mapę pokrycia](coverage.json).','', '## Spis treści','']
    for part in PARTS:
        md.append(f'### {TITLES[part]}');md.append('')
        for e in grouped[part]:md.append(f'- [{e["names"]["pl"]}](#{e["id"]})')
        md.append('')
    for part in PARTS:
        md.extend([f'## {TITLES[part]}',''])
        for e in grouped[part]:
            md.extend([f'<a id="{e["id"]}"></a>',f'### {e["names"]["pl"]}','',f'**EN:** {e["names"]["en"]} · **LAT:** {e["names"]["lat"]} · **ID opisu:** `{e["id"]}`',''])
            for f,label in [('projectRegionIds','Regiony modelu'),('projectStructureIds','Karty funkcjonalne'),('projectCircuitIds','Obwody projektu')]:
                if e[f]:md.extend([f'**{label}:** '+', '.join(f'`{x}`' for x in e[f]),''])
            for f,label in [('relatedStructureIds','Powiązane karty funkcjonalne'),('relatedCircuitIds','Powiązane obwody projektu')]:
                if e.get(f):md.extend([f'**{label}:** '+', '.join(f'`{x}`' for x in e[f]),''])
            for f,label in [('projectHierarchyIds','Grupy hierarchii projektu'),('projectSpatialAnchorIds','Węzły przestrzenne omawiane w artykule')]:
                if e.get(f):md.extend([f'**{label}:** '+', '.join(f'`{x}`' for x in e[f]),''])
            if not any(e[f] for f in MAPPING_FIELDS):md.extend(['**Zakres:** uzupełnienie tekstowe; brak osobnej parceli lub karty w aktualnym modelu.',''])
            for f,label in LABELS.items():
                value=e.get(f)
                if value:
                    if isinstance(value,list):value=' '.join(str(v) for v in value)
                    md.extend([f'**{label}.** {value}',''])
            md.append('**Źródła i zakres odwołania:**')
            md.append('')
            for ref in e['sources']:md.append(f'- [{source_by_id[ref["sourceId"]]["title"]}](#source-{ref["sourceId"]}) — {ref["locator"].rstrip(".")}.')
            if e.get('inheritedReferenceIds'):md.append('- Bibliografia odziedziczona z projektu (odsyłacze do dalszej lektury, nie automatyczne potwierdzenie ponownego sprawdzenia): '+', '.join('`'+s+'`' for s in e['inheritedReferenceIds'])+'.')
            md.append('')
    md.extend(['## Bibliografia i pochodzenie',''])
    for s in sources:
        md.extend([f'<a id="source-{s["id"]}"></a>',f'### {s["title"]}','',f'**ID:** `{s["id"]}`',''])
        for f,label in [('authors','Autorzy'),('year','Rok'),('edition','Wydanie'),('url','Adres'),('localPath','Plik lokalny'),('status','Zakres sprawdzenia'),('scope','Zastosowanie'),('limitations','Ograniczenia'),('sha256','SHA-256')]:
            if f in s:
                value=s[f]
                if f=='url':value=f'[{s["title"]}]({value})'
                elif f=='localPath':value=f'`{value}`'
                elif isinstance(value,(list,dict)):value=json.dumps(value,ensure_ascii=False)
                md.extend([f'**{label}:** {value}',''])
    outputs={'neuroanatomia-kompendium.json':dump(dataset),'NEUROANATOMIA_KOMPENDIUM.md':'\n'.join(md).rstrip()+'\n','coverage.json':dump(coverage)}
    for name,content in outputs.items():
        p=HERE/name
        if args.check:
            if not p.exists() or p.read_text()!=content:raise ValueError(f'Nieaktualny eksport: {name}')
        else:p.write_text(content)
    print(dump({'result':'PASS','mode':'check' if args.check else 'build','counts':counts}).strip())

if __name__=='__main__':
    try:main()
    except (ValueError,KeyError,subprocess.CalledProcessError) as exc:
        print(f'ERROR: {exc}',file=sys.stderr);sys.exit(1)
