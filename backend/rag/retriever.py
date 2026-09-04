import os

from dotenv import load_dotenv
from qdrant_client import QdrantClient

from rag.embedding import create_embedding
from rag.generator import generate_answer


# --------------------------------------------------
# ENVIRONMENT
# --------------------------------------------------

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "personal_knowledge"


# --------------------------------------------------
# CONNECT TO QDRANT
# --------------------------------------------------

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

print("Connected to Qdrant.")


# --------------------------------------------------
# CHECK PROJECT-LIST QUESTIONS
# --------------------------------------------------

def is_project_list_question(question):
    """
    Check whether the user is asking for a list of projects.

    These questions should use the dedicated
    LIST OF PROJECTS chunk instead of normal
    semantic search.
    """

    question = question.lower().strip()

    project_list_patterns = [
        "what projects",
        "which projects",
        "list projects",
        "list the projects",
        "list out the projects",
        "your projects",
        "all projects",
        "projects have you built",
        "projects did you build",
        "projects have you made",
        "projects did you make",
    ]

    return any(
        pattern in question
        for pattern in project_list_patterns
    )


# --------------------------------------------------
# NORMAL SEMANTIC SEARCH
# --------------------------------------------------

def semantic_search(question, limit=5):
    """
    Convert the question into an embedding
    and retrieve the most relevant chunks
    from Qdrant.
    """

    vector = create_embedding(
        question
    ).tolist()

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=vector,
        limit=limit,
        with_payload=True
    ).points

    return results


# --------------------------------------------------
# PROJECT LIST SEARCH
# --------------------------------------------------

def search_project_list():
    """
    Retrieve the dedicated LIST OF PROJECTS chunk.

    We scan the small knowledge base and find
    the chunk whose first line is exactly
    "LIST OF PROJECTS".
    """

    results, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        limit=100,
        with_payload=True,
        with_vectors=False
    )

    for result in results:

        text = result.payload.get(
            "text",
            ""
        ).strip()

        first_line = text.split(
            "\n",
            1
        )[0].strip()

        if first_line.upper() == "LIST OF PROJECTS":
            return [result]

    return []


# --------------------------------------------------
# SEARCH
# --------------------------------------------------

def search(question, limit=5):
    """
    Decide how to retrieve information based on
    the type of question.

    Project-list questions use the dedicated
    LIST OF PROJECTS chunk.

    All other questions use normal semantic search.
    """

    if is_project_list_question(question):

        print(
            "\n[Retriever] Project-list question detected."
        )

        return search_project_list()

    print(
        "\n[Retriever] Using semantic search."
    )

    return semantic_search(
        question,
        limit=limit
    )


# --------------------------------------------------
# BUILD CONTEXT
# --------------------------------------------------

def build_context(results):
    """
    Convert retrieved Qdrant results
    into context for the LLM.
    """

    context_parts = []

    for i, result in enumerate(
        results,
        start=1
    ):

        text = result.payload.get(
            "text",
            ""
        )

        context_parts.append(
            f"[Source {i}]\n{text}"
        )

    return "\n\n".join(context_parts)


# --------------------------------------------------
# MAIN TEST
# --------------------------------------------------

if __name__ == "__main__":

    question = "What projects have you built?"

    print("\n--- QUESTION ---")
    print(question)

    # --------------------------------------------------
    # RETRIEVE RELEVANT CHUNKS
    # --------------------------------------------------

    results = search(question)

    # --------------------------------------------------
    # DISPLAY RETRIEVED RESULTS
    # --------------------------------------------------

    print("\n--- RETRIEVED CONTEXT ---")

    if not results:

        print(
            "No matching project-list chunk found."
        )

    for result in results:

        score = getattr(
            result,
            "score",
            None
        )

        text = result.payload.get(
            "text",
            "No text available"
        )

        if score is not None:

            print(
                f"Score: {score:.3f}"
            )

        print(text)
        print("----------------")

    # --------------------------------------------------
    # BUILD CONTEXT
    # --------------------------------------------------

    context = build_context(
        results
    )

    # --------------------------------------------------
    # GENERATE ANSWER
    # --------------------------------------------------

    answer = generate_answer(
        question,
        context,
        history=[]
    )

    print("\n--- FINAL ANSWER ---")
    print(answer)