import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const suggestions = [
  "Tell me about yourself",
  "What projects have you built?",
  "Explain briefly about your project VeritasAI",
  "How can I connect with you?",
];

function App() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // --------------------------------------------------
  // AUTO SCROLL
  // --------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // --------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------

  async function sendMessage(currentQuestion) {
    if (!currentQuestion.trim() || loading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: currentQuestion,
    };

    // Save the current conversation history BEFORE
    // adding the new user question.
    const previousHistory = messages;

    // Add user message to UI
    setMessages((previousMessages) => [...previousMessages, userMessage]);

    // Clear input
    setQuestion("");

    // Start loading / streaming
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestion,
          history: previousHistory,
        }),
      });

      // --------------------------------------------------
      // CHECK RESPONSE
      // --------------------------------------------------

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // --------------------------------------------------
      // CHECK STREAM SUPPORT
      // --------------------------------------------------

      if (!response.body) {
        throw new Error("Streaming response is not supported by the browser.");
      }

      // --------------------------------------------------
      // CREATE EMPTY ASSISTANT MESSAGE
      // --------------------------------------------------

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content: "",
        },
      ]);

      // --------------------------------------------------
      // READ STREAM
      // --------------------------------------------------

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      let assistantContent = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        // Decode the incoming bytes
        const chunk = decoder.decode(value, {
          stream: true,
        });

        // Add new text to the complete answer
        assistantContent += chunk;

        // --------------------------------------------------
        // UPDATE ASSISTANT MESSAGE
        // --------------------------------------------------

        setMessages((previousMessages) => {
          const updatedMessages = [...previousMessages];

          const lastMessageIndex = updatedMessages.length - 1;

          updatedMessages[lastMessageIndex] = {
            role: "assistant",
            content: assistantContent,
          };

          return updatedMessages;
        });
      }

      // --------------------------------------------------
      // FLUSH DECODER
      // --------------------------------------------------

      const remainingText = decoder.decode();

      if (remainingText) {
        assistantContent += remainingText;

        setMessages((previousMessages) => {
          const updatedMessages = [...previousMessages];

          const lastMessageIndex = updatedMessages.length - 1;

          updatedMessages[lastMessageIndex] = {
            role: "assistant",
            content: assistantContent,
          };

          return updatedMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);

      // --------------------------------------------------
      // ERROR MESSAGE
      // --------------------------------------------------

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong while processing your question.",
        },
      ]);
    } finally {
      // Streaming finished
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // FORM SUBMIT
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    const currentQuestion = question.trim();

    if (!currentQuestion || loading) {
      return;
    }

    await sendMessage(currentQuestion);
  }

  // --------------------------------------------------
  // SUGGESTION CLICK
  // --------------------------------------------------

  async function handleSuggestionClick(suggestion) {
    if (loading) {
      return;
    }

    await sendMessage(suggestion);
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <>
      {/* =================================================
          CUSTOM SCROLLBAR
      ================================================= */}

      <style>
        {`
          /* ---------------------------------------------
             Hide horizontal scrollbar
          --------------------------------------------- */

          html,
          body {
            overflow-x: hidden;
          }

          /* ---------------------------------------------
             PersonalBot vertical scrollbar
          --------------------------------------------- */

          .personalbot-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(100, 116, 139, 0.45) transparent;
          }

          .personalbot-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .personalbot-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .personalbot-scroll::-webkit-scrollbar-thumb {
            background: rgba(100, 116, 139, 0.45);
            border-radius: 9999px;
          }

          .personalbot-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(129, 140, 248, 0.75);
          }

          /* ---------------------------------------------
             Prevent horizontal scrollbar inside chat
          --------------------------------------------- */

          .personalbot-scroll::-webkit-scrollbar:horizontal {
            display: none;
            height: 0;
          }

          /* ---------------------------------------------
             Smooth scrolling
          --------------------------------------------- */

          .personalbot-scroll {
            scroll-behavior: smooth;
          }
        `}
      </style>

      {/* =================================================
          PAGE
      ================================================= */}

      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        {/* =================================================
            BACKGROUND IMAGE
        ================================================= */}

        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.16]"
          style={{
            backgroundImage: "url('/personalbot_background.jpg')",
          }}
        />

        {/* =================================================
            DARK OVERLAY

            Keeps text readable over the photo.
        ================================================= */}

        <div className="pointer-events-none absolute inset-0 bg-slate-950/70" />

        {/* =================================================
            SUBTLE COLOR GLOW
        ================================================= */}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.10),transparent_55%)]" />

        {/* =================================================
            MAIN APPLICATION
        ================================================= */}

        <div className="relative z-10 mx-auto flex h-screen w-full max-w-6xl min-w-0 flex-col overflow-hidden">
          {/* =================================================
              HEADER
          ================================================= */}

          <header className="shrink-0 border-b border-white/10 bg-slate-950/50 px-4 py-4 backdrop-blur-md sm:px-6">
            <div className="mx-auto flex min-w-0 max-w-5xl items-center justify-between gap-4">
              {/* -----------------------------------------
                  LOGO + NAME
              ----------------------------------------- */}

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/90 to-violet-600/90 text-lg font-bold shadow-lg shadow-indigo-500/20">
                  I
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold tracking-tight text-white">
                    SiddBot
                  </h1>

                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />

                    <p className="text-xs text-slate-400">Online</p>
                  </div>
                </div>
              </div>

              {/* -----------------------------------------
                  HEADER RIGHT
              ----------------------------------------- */}

              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-sm font-medium text-slate-300">
                  Ask me about Ibraheem
                </p>

                <p className="text-xs text-slate-500">
                  AI-powered personal assistant
                </p>
              </div>
            </div>
          </header>

          {/* =================================================
              CHAT AREA
          ================================================= */}

          <main className="personalbot-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="mx-auto min-h-full w-full min-w-0 max-w-5xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
              {/* =================================================
                  WELCOME SCREEN
              ================================================= */}

              {messages.length === 0 && !loading && (
                <div className="flex min-h-[calc(100vh-220px)] flex-col items-center justify-center px-2 text-center">
                  {/* -----------------------------------------
                      ICON
                  ----------------------------------------- */}

                  <div className="mb-6 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/80 to-violet-600/80 text-2xl shadow-xl shadow-indigo-500/20 backdrop-blur-sm">
                    ✦
                  </div>

                  {/* -----------------------------------------
                      HEADING
                  ----------------------------------------- */}

                  <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Hi, I'm SiddBot
                  </h2>

                  {/* -----------------------------------------
                      DESCRIPTION
                  ----------------------------------------- */}

                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                    Ask me about Ibraheem's skills, projects, education,
                    experience, achievements, or anything available in his
                    personal information.
                  </p>

                  {/* -----------------------------------------
                      SUGGESTIONS
                  ----------------------------------------- */}

                  <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={loading}
                        className="group min-w-0 rounded-xl border border-white/10 bg-slate-900/45 px-4 py-4 text-left text-sm text-slate-300 shadow-lg shadow-black/10 backdrop-blur-md transition duration-200 hover:border-indigo-400/30 hover:bg-slate-900/65 hover:text-white hover:shadow-indigo-950/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="flex min-w-0 items-center justify-between gap-3">
                          <span className="min-w-0 break-words">
                            {suggestion}
                          </span>

                          <span className="shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-indigo-400">
                            →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* =================================================
                  MESSAGES
              ================================================= */}

              {messages.length > 0 && (
                <div className="w-full min-w-0 space-y-6">
                  {messages.map((message, index) => {
                    const isUser = message.role === "user";

                    return (
                      <div
                        key={index}
                        className={`flex min-w-0 w-full ${
                          isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {/* =================================================
                            MESSAGE BUBBLE

                            Slightly more transparent so the
                            background image remains visible.
                        ================================================= */}

                        <div
                          className={`min-w-0 max-w-[90%] overflow-hidden break-words backdrop-blur-md sm:max-w-[80%] ${
                            isUser
                              ? "rounded-2xl rounded-br-md border border-indigo-400/20 bg-indigo-600/45 px-4 py-3 shadow-lg shadow-indigo-950/20"
                              : "rounded-2xl rounded-bl-md border border-white/10 bg-slate-900/40 px-5 py-4 shadow-lg shadow-black/10"
                          }`}
                        >
                          {/* =================================================
                              USER MESSAGE
                          ================================================= */}

                          {isUser ? (
                            <p className="break-words text-sm leading-6 text-white">
                              {message.content}
                            </p>
                          ) : (
                            /* =================================================
                               ASSISTANT MESSAGE
                            ================================================= */

                            <div
                              className="
                                min-w-0
                                break-words
                                text-sm
                                leading-7
                                text-slate-300

                                [&>p]:mb-4
                                [&>p:last-child]:mb-0

                                [&>h1]:mb-3
                                [&>h1]:mt-5
                                [&>h1]:text-xl
                                [&>h1]:font-semibold
                                [&>h1]:text-white

                                [&>h2]:mb-3
                                [&>h2]:mt-5
                                [&>h2]:text-lg
                                [&>h2]:font-semibold
                                [&>h2]:text-white

                                [&>h3]:mb-2
                                [&>h3]:mt-4
                                [&>h3]:text-base
                                [&>h3]:font-semibold
                                [&>h3]:text-white

                                [&>ul]:mb-4
                                [&>ul]:list-disc
                                [&>ul]:space-y-1
                                [&>ul]:pl-5

                                [&>ol]:mb-4
                                [&>ol]:list-decimal
                                [&>ol]:space-y-1
                                [&>ol]:pl-5

                                [&_li]:break-words
                                [&_li]:pl-1

                                [&_strong]:font-semibold
                                [&_strong]:text-white

                                [&_a]:break-all
                                [&_a]:font-bold
                                [&_a]:text-indigo-400
                                [&_a]:underline
                                [&_a]:underline-offset-2
                                [&_a:hover]:text-indigo-300

                                [&_code]:break-all
                                [&_code]:rounded
                                [&_code]:bg-slate-800/80
                                [&_code]:px-1.5
                                [&_code]:py-0.5
                                [&_code]:text-indigo-300
                              "
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({ node, ...props }) => (
                                    <a
                                      {...props}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    />
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* =================================================
                      STREAMING INDICATOR
                  ================================================= */}

                  {loading && (
                    <div className="flex min-w-0 justify-start">
                      <div className="rounded-2xl rounded-bl-md border border-white/10 bg-slate-900/40 px-5 py-4 shadow-lg shadow-black/10 backdrop-blur-md">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />

                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:150ms]" />

                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      AUTO-SCROLL TARGET
                  ================================================= */}

                  <div
                    ref={messagesEndRef}
                    className="h-px w-full"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
          </main>

          {/* =================================================
              INPUT AREA
          ================================================= */}

          <footer className="shrink-0 border-t border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur-md sm:px-6">
            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-4xl">
              <div className="flex min-w-0 items-center gap-3">
                {/* -----------------------------------------
                    INPUT
                ----------------------------------------- */}

                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    placeholder="Ask something about Ibraheem..."
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    disabled={loading}
                    className="w-full min-w-0 rounded-xl border border-white/10 bg-slate-900/55 px-4 py-3.5 text-sm text-white shadow-lg shadow-black/10 outline-none backdrop-blur-md transition placeholder:text-slate-500 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* -----------------------------------------
                    SEND BUTTON
                ----------------------------------------- */}

                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="shrink-0 rounded-xl border border-indigo-400/20 bg-gradient-to-r from-indigo-600/90 to-violet-600/90 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 backdrop-blur-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "..." : "Send"}
                </button>
              </div>

              <p className="mt-2 text-center text-xs text-slate-600">
                PersonalBot answers only from available personal information.
              </p>
            </form>
          </footer>
        </div>
      </div>
    </>
  );
}

export default App;
