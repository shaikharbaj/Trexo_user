/**
 * @fileoverview
 * User controller file to handle all user related message pattern.
 *
 * @version
 * API version 1.0.
 *
 * @author
 * KATALYST TEAM
 *
 * @license
 * Licensing information, if applicable.
 */
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  GatewayTimeoutException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { MessagePattern, RpcException } from "@nestjs/microservices";
import { UserService } from "./user.service";
import { MS_CONFIG } from "ms.config";
import { USER_PATTERN } from "./pattern";
import { Auth, Data, Id, Page, File, QueryString } from "src/common/decorators";
import { CreateBuyerDto } from "./dto/create-buyer.dto";

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @description
   * Message format exception
   */
  exceptionHandler(error: any) {
    if (error instanceof BadRequestException) {
      return new RpcException({
        statusCode: 400,
        message: error.message,
      });
    } else if (error instanceof UnauthorizedException) {
      return new RpcException({
        statusCode: 401,
        message: error.message,
      });
    } else if (error instanceof ForbiddenException) {
      return new RpcException({
        statusCode: 403,
        message: error.message,
      });
    } else if (error instanceof NotFoundException) {
      return new RpcException({
        statusCode: 404,
        message: error.message,
      });
    } else if (error instanceof ConflictException) {
      return new RpcException({
        statusCode: 409,
        message: error.message,
      });
    } else if (error instanceof BadGatewayException) {
      return new RpcException({
        statusCode: 502,
        message: error.message,
      });
    } else if (error instanceof ServiceUnavailableException) {
      return new RpcException({
        statusCode: 503,
        message: error.message,
      });
    } else if (error instanceof GatewayTimeoutException) {
      return new RpcException({
        statusCode: 504,
        message: error.message,
      });
    } else {
      return new RpcException({
        statusCode: 500,
        message: "Internal server error",
      });
    }
  }

  /**
   * @description
   * Message pattern handler to fetch particular user with given condition
   */
  @MessagePattern(USER_PATTERN[MS_CONFIG.transport].findUserByConditionForLogin)
  async findUserByConditionForLogin(condition: any) {
    try {
      return await this.userService.findUserByConditionForLogin(condition);
    } catch (error) {
      throw this.exceptionHandler(error);
    }
  }

  /**
   * @description
   * Message pattern handler to verify particular user permission
   */
  @MessagePattern(USER_PATTERN[MS_CONFIG.transport].verifyUserPermission)
  async verifyUserPermission(@Data() data: any) {
    return await this.userService.verifyUserPermission(data);
  }

  /**
   * @description.
   * Message pattern handler to create new buyer
   */
  @MessagePattern(USER_PATTERN[MS_CONFIG.transport].registerBuyer)
  async registerBuyer(@Data() data: CreateBuyerDto) {
    try {
      return await this.userService.registerBuyer(data);
    } catch (error) {
      throw this.exceptionHandler(error);
    }
  }

  /**
   * @description
   * Message pattern handler to buyer login
   */
  @MessagePattern(USER_PATTERN[MS_CONFIG.transport].findBuyerForLogin)
  async findBuyerForLogin(@Data() data: any) {
    try {
      return await this.userService.findBuyerForLogin(data);
    } catch (error) {
      throw this.exceptionHandler(error);
    }
  }

  /**
   * @description
   * Message pattern handler to send otp.
   */
  @MessagePattern(USER_PATTERN[MS_CONFIG.transport].sendBuyerRegisterOTP)
  async sendBuyerRegisterOTP(@Data() data: any) {
    try {
      return await this.userService.sendBuyerRegisterOTP(data);
    } catch (error) {
      throw this.exceptionHandler(error);
    }
  }

    /**
   * @description
   * Message pattern handler to verify otp.
   */
  @MessagePattern(USER_PATTERN[MS_CONFIG.transport].verifyBuyerRegisterOTP)
  async verifyBuyerRegisterOTP(@Data() data: any) {
    try {
      return await this.userService.verifyBuyerRegisterOTP(data);
    } catch (error) {
      throw this.exceptionHandler(error);
    }
  }
}
