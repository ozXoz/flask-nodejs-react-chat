import React from "react";
import { useDropzone } from "react-dropzone";
import "./fileUpload.css";

const FileUpload = () => {
  const onDrop = (acceptedFiles) => {
    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);

    fetch("http://localhost:4000/file/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => alert(data.message))
      .catch((error) => alert("File upload failed"));
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="file-upload" {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Drag & drop files here, or click to select files</p>
    </div>
  );
};

export default FileUpload;
