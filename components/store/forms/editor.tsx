"use client";

import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { toast } from "sonner";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, disabled }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isMounted = useRef(false);
  const isUpdating = useRef(false);

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append("image", file);

        try {
          const response = await fetch("/api/upload-image", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const text = await response.text();
            console.error("Upload API error:", {
              status: response.status,
              responseText: text || "No response body",
            });
            throw new Error(
              `Failed to upload image: ${response.status} ${response.statusText}`
            );
          }

          const text = await response.text();
          if (!text) {
            throw new Error("Empty response from server");
          }

          const data = JSON.parse(text);
          const imageUrl = data.url;

          const quill = quillRef.current;
          if (quill) {
            const range = quill.getSelection();
            if (range) {
              quill.insertEmbed(range.index, "image", imageUrl);
            }
          }
        } catch (error) {
          console.error("Image upload error:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to upload image"
          );
        }
      }
    };
  };

  const videoHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "video/*"); // Restrict to video files
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append("video", file); // Match the key expected by /api/upload-video

        try {
          const response = await fetch("/api/upload-video", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const text = await response.text();
            console.error("Video upload API error:", {
              status: response.status,
              responseText: text || "No response body",
            });
            throw new Error(
              `Failed to upload video: ${response.status} ${response.statusText}`
            );
          }

          const text = await response.text();
          if (!text) {
            throw new Error("Empty response from server");
          }

          const data = JSON.parse(text);
          const videoUrl = data.url;

          const quill = quillRef.current;
          if (quill) {
            const range = quill.getSelection(true); // Ensure cursor position is captured
            if (range) {
              quill.insertEmbed(range.index, "video", videoUrl);
            }
          }
        } catch (error) {
          console.error("Video upload error:", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to upload video"
          );
        }
      }
    };
  };

  useEffect(() => {
    if (editorRef.current && !isMounted.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: {
            container: [
              [{ header: [1, 2, 3, false] }, { font: [] }],
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "image", "video"],
            ],
            handlers: {
              image: imageHandler,
              video: videoHandler, // Add video handler
            },
          },
        },
        placeholder: "Enter product description...",
      });

      isMounted.current = true;

      // Always set the initial value, handling empty string
      quillRef.current.root.innerHTML = value || "<p><br></p>";

      quillRef.current.on("text-change", () => {
        if (!isUpdating.current) {
          let content = quillRef.current?.root.innerHTML || "";
          // Treat <p><br></p> as empty
          if (content === "<p><br></p>") {
            content = "";
          }
          onChange(content);
        }
      });

      if (disabled) {
        quillRef.current.disable();
      } else {
        quillRef.current.enable();
      }
    }

    return () => {
      if (quillRef.current) {
        quillRef.current.off("text-change");
        quillRef.current = null;
        isMounted.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (quillRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      let newValue = value;
      if (newValue === "") {
        newValue = "<p><br></p>";
      }
      if (newValue !== currentContent) {
        isUpdating.current = true;
        quillRef.current.root.innerHTML = newValue;
        isUpdating.current = false;
      }
    }
  }, [value]);

  useEffect(() => {
    if (quillRef.current) {
      if (disabled) {
        quillRef.current.disable();
      } else {
        quillRef.current.enable();
      }
    }
  }, [disabled]);

  return (
    <div className="bg-white">
      <div ref={editorRef} style={{ minHeight: "200px" }} />
    </div>
  );
};

export default Editor;