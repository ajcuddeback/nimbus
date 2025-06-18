package com.nimbus.weatherapi.controller.responses;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value= HttpStatus.BAD_REQUEST, reason="Missing required param")
public class MissingRequiredParamException extends RuntimeException {
}
