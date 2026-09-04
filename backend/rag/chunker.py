import re

from rag.loader import load_document


# ==========================================================
# SECTION HEADINGS
# ==========================================================

SECTION_HEADINGS = [
    "PERSONAL INFORMATION",
    "ABOUT",
    "PROFESSIONAL CAREER",
    "EDUCATIONAL BACKGROUND",
    "CERTIFICATION",
    "TECHNICAL SKILLS",
    "LIST OF PROJECTS",
    "PROJECTS",
    "ACHIEVEMENTS",
    "PERSONAL INTERESTS",
    "CAREER GOAL",
    "CONNECT ME",
]


# ==========================================================
# PROJECT HEADINGS
# ==========================================================

PROJECT_NAMES = [
    "PROJECT: VERITASAI",
    "PROJECT: FOREVER",
    "PROJECT: GROBUZZ",
    "PROJECT: MYPORTFOLIO",
]


# ==========================================================
# SPLIT DOCUMENT BY MAIN HEADINGS
# ==========================================================

def split_by_headings(text, headings):
    """
    Split the document whenever one of the given headings
    appears on its own line.

    Example:

    ABOUT
    ...
    TECHNICAL SKILLS
    ...

    becomes:

    [
        "ABOUT\n...",
        "TECHNICAL SKILLS\n..."
    ]
    """

    escaped_headings = [
        re.escape(heading)
        for heading in headings
    ]

    pattern = re.compile(
        r"(?mi)^(" +
        "|".join(escaped_headings) +
        r")\s*$"
    )

    matches = list(pattern.finditer(text))

    sections = []

    for i, match in enumerate(matches):

        start = match.start()

        end = (
            matches[i + 1].start()
            if i + 1 < len(matches)
            else len(text)
        )

        section = text[start:end].strip()

        if section:
            sections.append(section)

    return sections


# ==========================================================
# SPLIT PROJECTS
# ==========================================================

def split_projects(project_section):
    """
    Split the PROJECTS section into individual project chunks.

    Example:

    PROJECTS

    PROJECT: VERITASAI
    ...

    PROJECT: FOREVER
    ...

    becomes:

    [
        "PROJECT: VERITASAI\n...",
        "PROJECT: FOREVER\n..."
    ]
    """

    escaped_projects = [
        re.escape(project)
        for project in PROJECT_NAMES
    ]

    pattern = re.compile(
        r"(?mi)^(" +
        "|".join(escaped_projects) +
        r")\s*$"
    )

    matches = list(pattern.finditer(project_section))

    projects = []

    for i, match in enumerate(matches):

        start = match.start()

        end = (
            matches[i + 1].start()
            if i + 1 < len(matches)
            else len(project_section)
        )

        project = project_section[start:end].strip()

        if project:
            projects.append(project)

    return projects


# ==========================================================
# CHECK WHETHER A SECTION IS THE PROJECT SECTION
# ==========================================================

def is_projects_section(section):
    """
    Check whether the given section starts with the
    PROJECTS heading.

    This is safer than using:

        section.startswith("PROJECTS")

    because it handles leading whitespace correctly.
    """

    first_line = section.split("\n", 1)[0].strip()

    return first_line.upper() == "PROJECTS"


# ==========================================================
# CREATE CHUNKS
# ==========================================================

def create_chunks(text):
    """
    Create semantic chunks from the personal knowledge document.

    Main sections become individual chunks.

    The LIST OF PROJECTS section remains as one dedicated
    project-list chunk.

    The PROJECTS section is split into individual project
    chunks so that every project becomes its own retrieval unit.
    """

    # ------------------------------------------------------
    # Normalize line endings
    # ------------------------------------------------------

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # ------------------------------------------------------
    # Remove excessive blank lines
    # ------------------------------------------------------

    text = re.sub(r"\n{3,}", "\n\n", text)

    # ------------------------------------------------------
    # Split main sections
    # ------------------------------------------------------

    sections = split_by_headings(
        text,
        SECTION_HEADINGS
    )

    chunks = []

    # ------------------------------------------------------
    # Process sections
    # ------------------------------------------------------

    for section in sections:

        # ----------------------------------------------
        # PROJECTS SECTION
        # ----------------------------------------------

        if is_projects_section(section):

            projects = split_projects(section)

            chunks.extend(projects)

        # ----------------------------------------------
        # ALL OTHER SECTIONS
        # ----------------------------------------------

        else:

            chunks.append(section)

    return chunks


# ==========================================================
# TESTING
# ==========================================================

if __name__ == "__main__":

    text = load_document(
        "data/personal_info.txt"
    )

    chunks = create_chunks(text)

    print()
    print("=" * 70)
    print(f"NUMBER OF CHUNKS: {len(chunks)}")
    print("=" * 70)

    for i, chunk in enumerate(chunks, start=1):

        print()
        print("=" * 70)
        print(f"CHUNK {i}")
        print("=" * 70)

        print(chunk)

        print()
        print(f"Characters: {len(chunk)}")