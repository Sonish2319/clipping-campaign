import os
import sys
import asyncio
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.ai.vector_store import vector_store
from app.ai.service import ai_service


KNOWLEDGE_DIR = backend_dir / "app" / "ai" / "knowledge"
COLLECTION_NAME = "marketplace_policies"


def chunk_markdown(content: str, source_filename: str):
    """Chunk markdown document by H2 headers and paragraphs."""
    sections = content.split("\n## ")
    chunks = []
    
    for i, section in enumerate(sections):
        lines = section.strip().split("\n")
        if not lines or not lines[0].strip():
            continue

        if i == 0 and not lines[0].startswith("# "):
            title = lines[0].replace("# ", "").strip()
            body = "\n".join(lines[1:]).strip()
        else:
            title = lines[0].replace("## ", "").strip()
            body = "\n".join(lines[1:]).strip()

        if body:
            chunks.append({
                "title": title,
                "text": f"## {title}\n{body}",
                "source": source_filename,
                "category": source_filename.replace(".md", "").replace("_", " ").title(),
            })
    return chunks


async def main():
    print("=" * 60)
    print("ClipRewards RAG Knowledge Base Ingestion")
    print(f"Target Qdrant Collection: {COLLECTION_NAME}")
    print(f"Active Provider: {ai_service.provider.__class__.__name__}")
    print("=" * 60)

    # 1. Ensure collection exists
    is_healthy = await vector_store.is_healthy()
    if not is_healthy:
        print("❌ Cannot connect to Qdrant at port 6333. Please ensure the container is running.")
        return

    await vector_store.ensure_collection(COLLECTION_NAME, vector_size=768)
    print("✓ Collection ensured in Qdrant.")

    # 2. Read markdown documents
    md_files = list(KNOWLEDGE_DIR.glob("*.md"))
    if not md_files:
        print(f"❌ No markdown files found in {KNOWLEDGE_DIR}")
        return

    all_chunks = []
    for file_path in md_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        chunks = chunk_markdown(content, file_path.name)
        all_chunks.extend(chunks)
        print(f"✓ Parsed {file_path.name}: {len(chunks)} sections")

    print(f"\nComputing embeddings for {len(all_chunks)} chunks...")
    points = []
    for idx, chunk in enumerate(all_chunks):
        vector = await ai_service.provider.get_embedding(chunk["text"])
        points.append({
            "id": idx + 1,
            "vector": vector,
            "payload": chunk,
        })
        print(f"  [{idx + 1}/{len(all_chunks)}] Embedded: {chunk['title'][:40]}...")

    # 3. Upsert to Qdrant
    success = await vector_store.upsert_documents(COLLECTION_NAME, points)
    if success:
        print(f"\n🎉 Successfully ingested {len(points)} knowledge points into Qdrant '{COLLECTION_NAME}'!")
    else:
        print("\n❌ Failed to upsert documents into Qdrant.")

    # 4. Test sample retrieval
    test_query = "What happens if a creator runs out of budget?"
    print(f"\nTesting similarity retrieval for query: '{test_query}'")
    query_vec = await ai_service.provider.get_embedding(test_query)
    matches = await vector_store.search(COLLECTION_NAME, query_vec, limit=2)
    for m in matches:
        score = m.get("score")
        title = m.get("payload", {}).get("title")
        print(f"  • [Score: {score:.3f}] {title}")


if __name__ == "__main__":
    asyncio.run(main())
