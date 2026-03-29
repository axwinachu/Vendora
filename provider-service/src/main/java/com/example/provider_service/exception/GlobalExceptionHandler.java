package com.example.provider_service.exception;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ExceedImagesException.class)
    public ErrorResponse handleExceedImage(Exception ex){
        return new ErrorResponse("400",ex.getMessage());
    }
    @ExceptionHandler(FileDeletionFailedException.class)
    public ErrorResponse fileDeletionFailedException(Exception ex){
        return new ErrorResponse("400",ex.getMessage());
    }
    @ExceptionHandler(FileEmptyException.class)
    public ErrorResponse handleFileEmpty(FileEmptyException ex){
        return new ErrorResponse("400",ex.getMessage());
    }
    @ExceptionHandler(ImageNotFoundException.class)
    public ErrorResponse handleImageNotFound(ImageNotFoundException ex){
        return new ErrorResponse("400",ex.getMessage());
    }
    @ExceptionHandler(InvalidFileFormateException.class)
    public ErrorResponse handleInvalidFileFormat(InvalidFileFormateException ex){
        return new ErrorResponse("400",ex.getMessage());
    }
    @ExceptionHandler(ProfileAlreadyExistsException.class)
    public ErrorResponse handelProfileAlreadyExists (ProfileAlreadyExistsException ex){
        return new ErrorResponse("400",ex.getMessage());
    }
    @ExceptionHandler(ProfileNotFoundException.class)
    public ErrorResponse handleProfileNotFound(Exception ex){
        return new ErrorResponse("400",ex.getMessage());
    }
    @ExceptionHandler(UploadingFailedException.class)
    public ErrorResponse handleUploadingFailed(Exception ex){
        return new ErrorResponse("400",ex.getMessage());
    }
}
