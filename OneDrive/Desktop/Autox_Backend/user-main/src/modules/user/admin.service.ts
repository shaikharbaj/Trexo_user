/**
 * @fileoverview
 * Admin service file to handle all admin user related functionality.
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
} from '@nestjs/common';
import { ClientKafka, ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { UserType, UserStatus } from '@prisma/client';
import { UserRepository, AuthRepository, UserRoleRepository } from './repository';
import { PermissionService } from '../permission/permission.service';
import { RoleService } from '../role/role.service';
import { SerialNumberConfigurationService } from '../serial-number-configiration/serial-number-configuration.service';
import { CommonHelper, SecurityHelper } from 'src/common/helpers';
import { CreateAdminUserBody, ToggleAdminUserVisibilityBody, UpdateAdminUserBody } from './types';

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private userRepository: UserRepository,
    private authRepository: AuthRepository,
    private userRoleRepository: UserRoleRepository,
    private permissionService: PermissionService,
    private roleService: RoleService,
    private serialNumberConfigurationService: SerialNumberConfigurationService,
    private commonHelper: CommonHelper,
    private securityHelper: SecurityHelper,
  ) {}

  async onModuleInit() {}

  async onModuleDestroy() {}

  /**
   * @description
   * Function to find particular user of given condition
   */
  async findUserByCondition(condition: any) {
    return this.userRepository.findOne(condition.select, condition.where);
  }

  /**
   * @description
   * Function to find particular user by email
   */
  async findUserByEmail(emailId: string, select: any, where: any = {}) {
    const emailHash = await this.securityHelper.hash(emailId);
    const userCondition = {
      select: select,
      where: {
        ...where,
        email: {
          startsWith: `${emailHash}|`,
        },
      }
    };
    return this.userRepository.findOne(userCondition.select, userCondition.where);
  }

  /**
   * @description
   * Function to find particular user of given condition with delete check
   */
  async findUserByConditionWithoutDelete(condition: any) {
    return this.userRepository.findOneWithoutDelete(condition.select, condition.where);
  }

  /**
   * @description
   * Function to check whether provided roles exist or not
   */
  public checkRolesExits(roles: any) {
    return this.roleService.fetchRolesByCondition(
      { id: true, role_name: true },
      { uuid: { in: roles } },
    );
  }

  /**
   * @description
   * Function to generate employee Id
   */
  async generateEmployeeId() {
    const serialObj = await this.serialNumberConfigurationService.fetchSerialNumber('ADMIN_USER');
    return this.commonHelper.generateUniqueId(serialObj.alias, serialObj.uniqueNumber);
  }

  /**
   * @description
   * Function to generate user payload
   */
  async generateUserPayload(payload: any) {
    const names = payload.name.split(' ');
    const emailEncrypt = await this.securityHelper.encrypt(payload.email_id);
    let obj = {
      first_name: '',
      middle_name: '',
      last_name: '',
      email: emailEncrypt,
      designation: payload?.position ? payload.position : null,
      user_type: 'SUBADMIN',
      status: 'ACTIVE',
    };
    if (names.length === 1) {
      obj.first_name = names[0];
    } else if (names.length === 2) {
      obj.first_name = names[0];
      obj.last_name = names[1];
    } else {
      obj.first_name = names[0];
      obj.middle_name = names[1];
      obj.last_name = names[2];
    }
    return obj;
  }

  /**
   * @description
   * Function to save allowed roles for given user
   */
  public attachRolesToUser(userId: number, roles: any) {
    const allowedRoleArr = [];
    roles.forEach((role: any) => {
      allowedRoleArr.push({
        user_id: userId,
        role_id: role.id,
      });
    });
    this.userRoleRepository.createMany(allowedRoleArr);
  }

  /**
   * @description
   * Function to find particular admin user by condition for login
   */
  async findAdminUserForLogin(payload: any) {
    const adminUserCondition = {
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
        OR: [{ user_type: 'ADMIN' }, { user_type: 'SUBADMIN' }]
      }
    }
    return this.findUserByEmail(payload.email_id, adminUserCondition.select, adminUserCondition.where);
  }

  /**
   * @description
   * Function to fetch all admin user
   */
  async fetchAllAdminUser(page: number, searchText: string) {
    try {
      const adminUserCondition = {
        select: {
          uuid: true,
          unique_id: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          designation: true,
          reporting_to: true,
          status: true,
          is_login: true,
          user_roles: {
            select: {
              role_id: true,
              role: {
                select: {
                  uuid: true,
                  role_name: true,
                },
              },
            },
          },
        },
        where: {
          user_type: UserType.SUBADMIN,
        },
      };
      if (searchText) {
        adminUserCondition['where']['OR'] = [
          { first_name: { contains: searchText, mode: 'insensitive' } },
          { middle_name: { contains: searchText, mode: 'insensitive' } },
          { last_name: { contains: searchText, mode: 'insensitive' } },
          { designation: { contains: searchText, mode: 'insensitive' } },
          {
            user_roles: {
              some: {
                role: {
                  role_name: { contains: searchText, mode: 'insensitive' },
                },
              },
            },
          },
        ];
      }
      const adminUsers = await this.userRepository.findManyWithPaginate(
        adminUserCondition.select,
        adminUserCondition.where,
        page,
      );
      return {
        status: true,
        message: 'Admin users fetched successfully.',
        data: adminUsers,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to fetch all deleted admin user
   */
  async fetchAllDeletedAdminUser(page: number, searchText: string) {
    try {
      const adminUserCondition = {
        select: {
          uuid: true,
          unique_id: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          designation: true,
          reporting_to: true,
          status: true,
          is_login: true,
          user_roles: {
            select: {
              role_id: true,
              role: {
                select: {
                  id: true,
                  role_name: true,
                },
              },
            },
          },
        },
        where: {
          user_type: UserType.SUBADMIN,
          is_deleted: true,
        },
      };
      const adminUsers = await this.userRepository.findManyWithPaginate(
        adminUserCondition.select,
        adminUserCondition.where,
        page
      );
      return {
        status: true,
        message: 'Deleted admin user fetched successfully.',
        data: adminUsers,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to fetch all the admin user for dropdown
   */
  async fetchAllAdminUserForDropdown() {
    try {
      const adminUserCondition = {
        select: {
          uuid: true,
          unique_id: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          designation: true,
        },
        where: {
          user_type: UserType.SUBADMIN,
          status: UserStatus.ACTIVE
        }
      }
      const adminUser = await this.userRepository.findMany(
        adminUserCondition.select,
        adminUserCondition.where
      );
      return {
        status: true,
        message: 'Admin user fetched successfully.',
        data: adminUser,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to fetch the admin user by id
   */
  async findAdminUserById(uuid: string) {
    try {
      const adminUserCondition = {
        select: {
          uuid: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          email: true,
          designation: true,
          reporting_to: true,
          user_roles: {
            select: {
              role_id: true,
              role: {
                select: {
                  uuid: true,
                  role_name: true,
                },
              },
            },
          },
        },
        where: {
          uuid: uuid
        }
      }
      const adminUser: any = await this.userRepository.findOne(
        adminUserCondition.select,
        adminUserCondition.where,
      );

      if (!adminUser) {
        throw new NotFoundException('Data not found');
      }
      //Decrypting email id
      //adminUser['email'] = await this.securityHelper.decrypt(adminUser.email);
      return {
        status: true,
        message: 'Admin user fetched successfully',
        data: adminUser,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to create admin user
   */
  async createAdminUser(auth: any, payload: CreateAdminUserBody) {
    try {
      let action = "CREATE";
      //Checking roles exist or not
      const parsedRoleIds = JSON.parse(payload.role_ids);
      if (parsedRoleIds.length === 0) {
        throw new BadRequestException('Please select atleast one role.');
      }
      //Checking reporting exist or not
      const parsedReportingTo = JSON.parse(payload.reporting_to);
      if (parsedReportingTo.length === 0) {
        throw new BadRequestException('Please select atleast one reporting.');
      }
      //Checking provided roles exists or not
      const roles = await this.checkRolesExits(parsedRoleIds);
      if (roles.length !== parsedRoleIds.length) {
        throw new BadRequestException('Role with specified id does not exist.');
      }
      // //Checking user email already exists
      const userSelect = {
        id: true,
        email: true,
        is_deleted: true
      };
      const anotherUserWithSameEmail: any = await this.findUserByEmail(payload.email_id, userSelect);
      if (anotherUserWithSameEmail && anotherUserWithSameEmail['is_deleted'] === false) {
        throw new BadRequestException('User with this email id already exists.');
      } else if(anotherUserWithSameEmail && anotherUserWithSameEmail['is_deleted'] === true) {
        action = 'RESTORE';
      }
      let adminUser = undefined;
      //Generating user payload
      const userPayload = await this.generateUserPayload(payload);
      userPayload['reporting_to'] = parsedReportingTo;
      if(action === "CREATE") {
        const uniqueId = await this.generateEmployeeId();
        userPayload['unique_id'] = uniqueId;
        userPayload['created_by'] = auth?.id;
        adminUser = await this.userRepository.create(userPayload);
      } else {
        userPayload['status'] = UserStatus.ACTIVE,
        userPayload['updated_by'] = auth?.id;
        userPayload['is_deleted'] = false;
        userPayload['deleted_at'] = null;
        userPayload['deleted_by'] = null;
        adminUser = await this.userRepository.update({id: anotherUserWithSameEmail.id, is_deleted: true}, userPayload);
      }
      if(adminUser) {
        //Generating user password  payload
        const encodedPassword = await this.commonHelper.encodePassword(payload.email_id);
        const authPayload = {
          user_id: adminUser.id,
          password: encodedPassword
        };
        if(action === "CREATE") {
          await this.authRepository.create(authPayload);
        } else {
          await this.authRepository.update({user_id: adminUser.id}, authPayload);
          //Removing already assigned roles
          await this.userRoleRepository.deleteMany({ user_id: adminUser.id });
        }
        this.attachRolesToUser(adminUser.id, roles);
        return {
          status: true,
          message: 'Admin user created successfully',
        };
      }
      throw new BadRequestException('Error while creating admin user.');
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to toggle the admin user status i.e: active and inactive
   */
  async toggleAdminUserVisibility(
    uuid: string,
    auth: any,
    payload: ToggleAdminUserVisibilityBody,
  ) {
    try {
      //Checking admin user exist or not
      const adminUserCondition = {
        select: {
          id: true,
          status: true,
        },
        where: {
          uuid: uuid
        }
      };
      const adminUser = await this.userRepository.findOne(adminUserCondition.select, adminUserCondition.where);
      if (!adminUser) {
        throw new NotFoundException('No data found.');
      }
      const updatePayload = {
        status: (payload.is_active === true) ? "ACTIVE" : "INACTIVE",
        updated_by: auth?.id,
      };
      const updateAdminUser = await this.userRepository.update(
        { id: adminUser.id },
        updatePayload,
      );
      if (updateAdminUser) {
        return {
          status: true,
          message: 'Admin user visibility updated successfully',
        };
      }
      throw new BadRequestException('Error while updating admin user visibility.');
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to update the admin user
   */
  async updateAdminUser(uuid: string, auth: any, payload: UpdateAdminUserBody) {
    try {
      //Checking roles exist or not
      const parsedRoleIds = JSON.parse(payload.role_ids);
      if (parsedRoleIds.length === 0) {
        throw new BadRequestException('Please select atleast one role.');
      }
      //Checking reporting exist or not
      const parsedReportingTo = JSON.parse(payload.reporting_to);
      if (parsedReportingTo.length === 0) {
        throw new BadRequestException('Please select atleast one reporting.');
      }
      //Checking provided roles exists or not
      const roles = await this.checkRolesExits(parsedRoleIds);
      if (roles.length !== parsedRoleIds.length) {
        throw new BadRequestException('Role with specified id does not exist.');
      }
      //Checking admin user exist or not
      const adminUserCondition = {
        select: {
          id: true,
          status: true,
        },
        where: {
          uuid: uuid
        }
      };
      const adminUser = await this.userRepository.findOne(adminUserCondition.select, adminUserCondition.where);
      if (!adminUser) {
        throw new NotFoundException('No data found.');
      }
      //Checking admin with same email already exist or not
      const anotherAdminUserWithSameEmailCondition = {
        select: {
          id: true,
          email: true
        },
        where: {id: { not: adminUser.id }}
      };
      const anotherAdminUserWithSameEmail = await this.findUserByEmail(payload.email_id, anotherAdminUserWithSameEmailCondition.select, anotherAdminUserWithSameEmailCondition.where);
      if (anotherAdminUserWithSameEmail) {
        throw new BadRequestException(
          'User with this email id already exist.',
        );
      }
      //Generating user payload
      const userPayload = this.generateUserPayload(payload);
      userPayload['reporting_to'] = parsedReportingTo;
      userPayload['updated_by'] = auth?.id;
      const updatedUser = await this.userRepository.update({id: adminUser.id}, userPayload);
      if (updatedUser) {
        //Removing already assigned roles
        await this.userRoleRepository.deleteMany({ user_id: updatedUser.id });
        //Assigning provided roles
        this.attachRolesToUser(updatedUser.id, roles);
        return {
          status: true,
          message: 'Admin user updated successfully.',
        };
      }
      throw new BadRequestException('Error while updating admin user.');
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to delete the admin user
   */
  async deleteAdminUser(uuid: string, auth: any) {
    try {
      //Checking admin user exist or not
      const adminUserCondition = {
        select: {
          id: true,
          status: true,
        },
        where: {
          uuid: uuid
        }
      };
      const adminUser = await this.userRepository.findOne(adminUserCondition.select, adminUserCondition.where);
      if (!adminUser) {
        throw new NotFoundException('No data found.');
      }
      const updatePayload = {
        status: UserStatus.INACTIVE,
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: auth?.id,
      };
      const deletedAdminUser = await this.userRepository.update(
        { id: adminUser.id },
        updatePayload,
      );
      if (deletedAdminUser) {
        return {
          status: true,
          message: 'Admin user deleted successfully',
        };
      }
      throw new BadRequestException('Error while deleting admin user.');
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to restore deleted the admin user details
   */
  async restoreAdminUser(uuid: string, auth: any) {
    try {
      //Checking user already exists
      const userCondition = {
        select: {
          id: true,
          email: true,
          is_deleted: true
        },
        where: {
          uuid: uuid,
          is_deleted: true
        }
      };
      const adminUser: any = await this.findUserByCondition(userCondition);
      if (!adminUser) {
        throw new NotFoundException('Data not found');
      }
      //Preparing restore payload
      const restoreCondition = {
        payload: {
          status: UserStatus.ACTIVE,
          updated_by: auth.id,
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
        },
        where: {
          id: adminUser?.id,
          is_deleted: true,
        },
      };
      const restoredAdminUser = await this.userRepository.update(
        restoreCondition.where,
        restoreCondition.payload,
      );
      if (restoredAdminUser) {
        return {
          status: true,
          message: 'Admin user restored successfully',
        };
      }
      throw new BadRequestException('Error while restoring admin user.');
    } catch (error) {
      throw error;
    }
  }
}
