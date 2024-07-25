/**
 * @fileoverview
 * User service file to handle all user related functionality.
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
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ClientKafka, ClientProxy, RpcException } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { UserType, UserStatus } from "@prisma/client";
import {
  AuthRepository,
  UserRepository,
  UserRoleRepository,
} from "./repository";
import { PermissionService } from "../permission/permission.service";
import { RoleService } from "../role/role.service";
import { CommonHelper, SecurityHelper } from "src/common/helpers";
import { SerialNumberConfigurationService } from "../serial-number-configiration/serial-number-configuration.service";
import { OtpRepository } from "./repository/otp.repository";
import { I18nContext, I18nService } from "nestjs-i18n";

@Injectable()
export class UserService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private userRepository: UserRepository,
    private readonly i18n: I18nService,
    private otpRepository: OtpRepository,
    private userRoleRepository: UserRoleRepository,
    private permissionService: PermissionService,
    private roleService: RoleService,
    private authRepository: AuthRepository,
    private serialNumberConfigurationService: SerialNumberConfigurationService,
    private commonHelper: CommonHelper,
    private securityHelper: SecurityHelper
  ) {}

  async onModuleInit() {}

  async onModuleDestroy() {}

  //Function to get current language
  public getLang(): string {
    const currentLang = I18nContext.current()?.lang;
    return currentLang ? currentLang : "en";
  }

  /**
   * @description
   * Function to generate employee Id
   */
  async generateEmployeeId() {
    const serialObj =
      await this.serialNumberConfigurationService.fetchSerialNumber(
        "BUYER_USER"
      );
    return this.commonHelper.generateUniqueId(
      serialObj.alias,
      serialObj.uniqueNumber
    );
  }

  /**
   * @description
   * Function to handel otp generation
   */
  async generateOtp(mobileNumber: number) {
    const otp = this.commonHelper.generateRandomOtp();
    await this.otpRepository.create({
      mobile_number: +mobileNumber,
      otp: otp,
    });
    return otp;
  }

  /**
   * @description
   * Function to find particular user by condition for login
   */
  async findUserByConditionForLogin(condition: any) {
    const select = {
      id: true,
      first_name: true,
      middle_name: true,
      last_name: true,
      email: true,
      mobile_number: true,
      status: true,
      auth: {
        select: {
          id: true,
          user_id: true,
          password: true,
        },
      },
    };
    return this.userRepository.findOne(select, condition);
  }

  /**
   * @description
   * Function to find particular user of given condition
   */
  async findUserByCondition(condition: any) {
    return this.userRepository.findOne(condition.select, condition.where);
  }

  /**
   * @description
   * Function to verify particular user permission
   */
  async verifyUserPermission(payload: any) {
    const auth = payload.auth;
    const { data } = await this.permissionService.findPermissionsBySlug(
      payload.permission
    );
    if (!data) {
      return {
        status: false,
        message: "Invalid permission.",
      };
    }
    const userRoleCondition = {
      select: {
        user_id: true,
        role_id: true,
      },
      where: {
        user_id: auth?.id,
      },
    };
    const userRoles = await this.userRoleRepository.findMany(
      userRoleCondition.select,
      userRoleCondition.where
    );
    if (userRoles.length === 0) {
      return {
        status: false,
        message: "Role not assigned yet, Please contact the administrator.",
      };
    }
    const roleIds = this.commonHelper.pluck(userRoles, "role_id");
    const rolePermissionExist = await this.roleService.verifyRolePermission(
      roleIds,
      data.id
    );
    if (rolePermissionExist) {
      return {
        status: true,
        message: "Specified permission present in role",
      };
    }
    return {
      status: false,
      message: "You dont have required permission to perform this action.",
    };
  }

  /**
   * @description
   * Function to find particular buyer user by condition for login
   */
  async findBuyerForLogin(payload: any) {
    const buyerCondition = {
      select: {
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        email: true,
        mobile_number: true,
        status: true,
        auth: {
          select: {
            id: true,
            user_id: true,
            password: true,
          },
        },
      },
      where: {
        user_type: "BUYER",
      },
    };
    return this.findBuyerByEmail(
      payload.email_id,
      buyerCondition.select,
      buyerCondition.where
    );
  }

  /**
   * @description
   * Function to find particular user by email
   */
  async findBuyerByEmail(emailId: string, select: any, where: any = {}) {
    const emailHash = await this.securityHelper.hash(emailId);
    const userCondition = {
      select: select,
      where: {
        ...where,
        email: {
          startsWith: `${emailHash}|`,
        },
      },
    };
    return this.userRepository.findOne(
      userCondition.select,
      userCondition.where
    );
  }

  /**
   * @description
   * Function to generate buyer payload
   */
  async generateBuyerPayload(payload: any) {
    const emailEncrypt = await this.securityHelper.encrypt(payload.email_id);
    const panCardNumberEncrypt = await this.securityHelper.encrypt(
      payload.pan_card_number
    );
    const aadharNumberEncrypt = await this.securityHelper.encrypt(
      payload.aadhar_card_number
    );
    const mobileNumberEncrypt = await this.securityHelper.encrypt(
      payload.mobile_number
    );
    let obj = {
      first_name: payload.first_name,
      middle_name: payload.middle_name,
      last_name: payload.last_name,
      email: emailEncrypt,
      mobile_number: mobileNumberEncrypt,
      pan_card_number: panCardNumberEncrypt,
      aadhar_card_number: aadharNumberEncrypt,
      user_type: UserType.BUYER,
      status: UserStatus.ACTIVE,
    };
    return obj;
  }

  /**
   * @description
   * Function to find particular user of given condition with delete check
   */
  async findUserByConditionWithoutDelete(condition: any) {
    return this.userRepository.findOneWithoutDelete(
      condition.select,
      condition.where
    );
  }

  /**
   * @description
   * Function to create buyer..
   */
  async registerBuyer(payload: any) {
    try {
      const lang = this.getLang();
      const userSelect = {
        id: true,
        email: true,
        is_deleted: true,
      };

      const anotherBuyerWithSameEmail: any = await this.findBuyerByEmail(
        payload.email_id,
        userSelect
      );
      if (
        anotherBuyerWithSameEmail &&
        anotherBuyerWithSameEmail["is_deleted"] === false
      ) {
        throw new BadRequestException(
          this.i18n.t("user._user_with_this_email_id_already_exists", { lang })
        );
      }
      //Generating user payload

      const buyerPayload = await this.generateBuyerPayload(payload);
      const uniqueId = await this.generateEmployeeId();
      buyerPayload["unique_id"] = uniqueId;
      let buyer = await this.userRepository.create(buyerPayload);
      if (buyer) {
        //Generating user password  payload
        const encodedPassword = await this.commonHelper.encodePassword(
          payload.password
        );
        const authPayload = {
          user_id: buyer.id,
          password: encodedPassword,
        };
        await this.authRepository.create(authPayload);
      }
      return {
        status: true,
        message: this.i18n.t("user._buyer_registered_successfully", { lang }),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to handel otp deletion
   */
  async deleteOtp(mobile_number: number) {
    const unVerifiedOtp = await this.otpRepository.findOne(
      { id: true, mobile_number: true, is_verified: true },
      { mobile_number: +mobile_number }
    );
    if (unVerifiedOtp) {
      await this.otpRepository.deleteOne({
        id: unVerifiedOtp.id,
      });
    }
    return;
  }

  /**
   * @description
   * Function to handel send otp
   */
  async sendBuyerRegisterOTP(payload: any) {
    try {
      const lang = this.getLang();
      // Deleting unverified otp
      await this.deleteOtp(payload.mobile_number);
      // Sending otp to user
      const generatedOtp = await this.generateOtp(payload.mobile_number);
      return {
        status: true,
        otp: generatedOtp,
        message: this.i18n.t("user._otp_send_successfully", { lang }),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to handel verify otp
   */
  async verifyBuyerRegisterOTP(payload: any) {
    try {
      const lang = this.getLang();
      //Checking OTP exists....
      const userOtp = await this.otpRepository.findOne(
        { id: true, mobile_number: true, is_verified: true },
        {
          mobile_number: +payload.mobile_number,
          otp: +payload.otp,
          is_verified: false,
        }
      );
      if (!userOtp) {
        throw new BadRequestException(
          this.i18n.t("user._invalid_otp", { lang })
        );
      }
      //Once otp matched updating otp flag
      await this.otpRepository.update(
        { mobile_number: +payload.mobile_number },
        { is_verified: true }
      );
      return {
        status: true,
        message: this.i18n.t("user._otp_verified_successfully", { lang }),
      };
    } catch (error) {
      throw error;
    }
  }
}
