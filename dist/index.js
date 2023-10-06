import { createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';

// src/createDropzone.tsx

// src/helpers.ts
var transformFiles = (files) => {
  const parsedFiles = [];
  if (!files)
    return parsedFiles;
  for (const i in files) {
    const fileIndex = +i;
    if (isNaN(+fileIndex))
      continue;
    const file = files[fileIndex];
    if (!file)
      continue;
    const parsedFile = {
      source: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      file
    };
    parsedFiles.push(parsedFile);
  }
  return parsedFiles;
};
var isMIMEtype = (accept) => {
  const MIMEregex = /^(application|audio|font|example|image|message|model|multipart|text|video)\/[a-z0-9!#$&^_`{}~*-]+$/i;
  return MIMEregex.test(accept);
};
var isFileExtension = (accept) => {
  const fileExtensionRegex = /^\.[a-z0-9!#$&^_`{}~-]+$/;
  return fileExtensionRegex.test(accept);
};
var parseAccept = (accept) => {
  if (!accept)
    return "";
  const parsedAccept = [];
  accept.forEach((acceptItem) => {
    if (isMIMEtype(acceptItem) || isFileExtension(acceptItem)) {
      parsedAccept.push(acceptItem);
    }
  });
  return parsedAccept.join(",");
};
var validateFiles = (files, accept, maxFileSize, minFileSize, maxFiles) => {
  const errors = {};
  if (maxFiles) {
    if (files.length > maxFiles) {
      const filesToBeRemoved = files.slice(maxFiles);
      filesToBeRemoved.forEach((file) => {
        errors[file.name] = {
          error: `${file.name} has been removed, you can only upload ${maxFiles} files`,
          file
        };
      });
    }
  }
  files.forEach((file) => {
    if (maxFileSize) {
      if (file.size > maxFileSize) {
        errors[file.name] = { error: `${file.name} is too large`, file };
      }
    }
    if (minFileSize) {
      if (file.size < minFileSize) {
        errors[file.name] = { error: `${file.name} is too small`, file };
      }
    }
    const fileMimeLeft = file.file.type.split("/")[0];
    const fileExtension = file.file.name.split(".").pop();
    if (accept === "*" || accept === "" || accept === " ")
      return;
    const acceptArray = accept.split(",");
    if (acceptArray.includes("*"))
      return;
    if (acceptArray.includes(file.file.type))
      return;
    if (acceptArray.includes(fileMimeLeft + "/*"))
      return;
    if (acceptArray.includes("." + fileExtension))
      return;
    if (accept && accept.includes(file.file.type))
      return;
    errors[file.name] = { error: `${file.name} is not an accepted file type`, file };
  });
  return errors;
};
var defaultProps = {
  disabled: false,
  maxSize: Infinity,
  minSize: 0,
  multiple: true,
  maxFiles: 0,
  accept: [],
  noClick: false,
  noKeyboard: false,
  noDrag: false
};

// src/createDropzone.tsx
var createDropzone = (props = defaultProps) => {
  const {
    disabled,
    multiple,
    accept,
    maxFiles,
    maxSize,
    minSize,
    noClick,
    noDrag,
    noKeyboard,
    validator
  } = props;
  if (isServer) {
    return {
      isFocused: () => false,
      isFileDialogActive: () => false,
      isDragging: () => false,
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      openFileDialog: () => {
      },
      setRefs: () => {
      },
      files: () => [],
      errors: () => ({}),
      removeFile: () => {
      },
      removeError: () => {
      },
      clearFiles: () => {
      }
    };
  }
  const [files, setFiles] = createSignal([]);
  const [isDragging, setIsDragging] = createSignal(false);
  const [isFocused, setIsFocused] = createSignal(false);
  const [isFileDialogActive, setIsFileDialogActive] = createSignal(false);
  const [errors, setErrors] = createSignal({});
  const parcedAccept = parseAccept(accept);
  let rootRef;
  let inputRef;
  const setRefs = (r, i) => {
    rootRef = r;
    inputRef = i;
  };
  const removeError = (fileName) => {
    setErrors((prev) => {
      if (!prev[fileName])
        return prev;
      const {
        [fileName]: _,
        ...rest
      } = prev;
      return rest;
    });
  };
  const removeFile = (fileName) => {
    const newFiles = files().filter((f) => f.file.name !== fileName);
    setFiles(newFiles);
    removeError(fileName);
    if (inputRef) {
      const dataTransfer = new DataTransfer();
      newFiles.forEach((file) => dataTransfer.items.add(file.file));
      const filesList = dataTransfer.files;
      inputRef.files = filesList;
    }
  };
  const clearFiles = () => {
    setFiles([]);
    setErrors({});
    if (inputRef) {
      inputRef.value = "";
    }
  };
  const openFileDialog = () => {
    if (disabled)
      return;
    if (inputRef) {
      clearFiles();
      inputRef.click();
      setIsFileDialogActive(true);
    }
  };
  const handleFiles = (files2, reset) => {
    if (disabled)
      return;
    if (reset)
      clearFiles();
    const transformedFiles = transformFiles(files2);
    if (validator) {
      const validFiles = transformedFiles.filter((file) => validator(file, transformedFiles));
      setFiles(validFiles);
    } else {
      const errors2 = validateFiles(transformedFiles, parcedAccept, maxSize, minSize, maxFiles);
      const validFiles = transformedFiles.filter((file) => !errors2[file.name]);
      setFiles(validFiles);
      setErrors(errors2);
      if (inputRef) {
        const dataTransfer = new DataTransfer();
        validFiles.forEach((file) => dataTransfer.items.add(file.file));
        const filesList = dataTransfer.files;
        inputRef.files = filesList;
      }
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled)
      return;
    if (noDrag)
      return;
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled)
      return;
    if (noDrag)
      return;
    setIsDragging(false);
  };
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled)
      return;
    if (noDrag)
      return;
    setIsDragging(true);
  };
  const handleDragStart = (e) => {
    if (disabled)
      return;
    if (noDrag)
      return;
  };
  const handleDragEnd = (e) => {
    if (disabled)
      return;
    if (noDrag)
      return;
  };
  const handleDragExit = (e) => {
    if (disabled)
      return;
    if (noDrag)
      return;
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled)
      return;
    if (noDrag)
      return;
    setIsDragging(false);
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length) {
      handleFiles(droppedFiles, true);
    }
  };
  const handleKeyDown = (e) => {
    if (!rootRef || !rootRef.isEqualNode(e.target))
      return;
    if (disabled)
      return;
    if (noKeyboard)
      return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFileDialog();
    }
  };
  const handleFocus = (e) => {
    if (disabled)
      return;
    setIsFocused(true);
  };
  const handleBlur = (e) => {
    if (disabled)
      return;
    setIsFocused(false);
  };
  const handleClick = (e) => {
    if (disabled)
      return;
    if (noClick)
      return;
    e.stopPropagation();
    const target = e.target;
    if (target.tagName === "LABEL")
      return;
    if (target.tagName === "INPUT" && target.type === "file")
      return;
    openFileDialog();
  };
  const handleChange = (e) => {
    if (disabled)
      return;
    const files2 = e.currentTarget.files;
    if (!files2)
      return;
    handleFiles(files2);
    setIsFileDialogActive(false);
  };
  const combineHandlers = (customHandler, defaultHandler, e) => {
    customHandler(e);
    if (defaultHandler) {
      setTimeout(() => defaultHandler(e), 0);
    }
  };
  const getInputProps = ({
    refKey = "ref",
    onChange,
    onClick,
    ...rest
  } = {}) => {
    return {
      [refKey]: inputRef,
      tabIndex: -1,
      type: "file",
      multiple,
      disabled,
      accept: parcedAccept,
      onChange: (e) => combineHandlers(handleChange, onChange, e),
      onClick: (e) => combineHandlers(handleClick, onClick, e),
      ...rest
    };
  };
  const getRootProps = ({
    refKey = "ref",
    role,
    onKeyDown,
    onFocus,
    onBlur,
    onClick,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
    ...rest
  } = {}) => ({
    [refKey]: rootRef,
    role: role || "presentation",
    onKeyDown: (e) => combineHandlers(handleKeyDown, onKeyDown, e),
    onFocus: (e) => combineHandlers(handleFocus, onFocus, e),
    onBlur: (e) => combineHandlers(handleBlur, onBlur, e),
    onClick: (e) => combineHandlers(handleClick, onClick, e),
    onDragStart: (e) => combineHandlers(handleDragStart, onDragEnter, e),
    onDragEnter: (e) => combineHandlers(handleDragEnter, onDragEnter, e),
    onDragOver: (e) => combineHandlers(handleDragOver, onDragOver, e),
    onDragLeave: (e) => combineHandlers(handleDragLeave, onDragLeave, e),
    onDragEnd: (e) => combineHandlers(handleDragEnd, onDragLeave, e),
    onDragExit: (e) => combineHandlers(handleDragExit, onDragLeave, e),
    onDrop: (e) => combineHandlers(handleDrop, onDrop, e),
    tabIndex: noKeyboard || disabled ? -1 : 0,
    ...rest
  });
  return {
    isFocused,
    isFileDialogActive,
    isDragging,
    getRootProps,
    getInputProps,
    openFileDialog,
    setRefs,
    files,
    errors,
    removeFile,
    removeError,
    clearFiles
  };
};
var createDropzone_default = createDropzone;

export { createDropzone, createDropzone_default as default };
