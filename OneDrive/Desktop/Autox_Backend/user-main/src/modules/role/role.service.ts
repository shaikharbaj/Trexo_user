/**
 * @fileoverview
 * Role service file to handle all role related functionality.
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
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleRepository, RolePermissionRepository } from './repository';
import { PermissionRepository } from '../permission/repository';
import { CommonHelper } from 'src/common/helpers';

@Injectable()
export class RoleService {
  constructor(
    private roleRepository: RoleRepository,
    private rolePermissionRepository: RolePermissionRepository,
    private permissionRepository: PermissionRepository,
    private commonHelper: CommonHelper,
  ) {}

  /**
   * @description
   * Function to find roles by given condition
   */
  async fetchRolesByCondition(select: any, condition: any) {
    return this.roleRepository.findMany(select, condition);
  }

  /**
   * @description
   * Function to find all roles
   */
  async fetchAllRole(page: number, searchText: string) {
    try {
      const roleCondition = {
        select: {
          uuid: true,
          role_name: true,
          slug: true,
          description: true,
          is_active: true,
        },
        where: {},
      };
      if (searchText) {
        roleCondition['where']['OR'] = [
          {
            role_name: {
              contains: searchText,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchText,
              mode: 'insensitive',
            },
          },
        ];
      }
      const roles = await this.roleRepository.findManyWithPaginate(
        roleCondition.select,
        roleCondition.where,
        page,
      );
      return {
        status: true,
        message: 'Roles fetched successfully.',
        data: roles,
      };
    } catch (err) {
      throw err;
    }
  }

  /**
   * @description
   * Function to find all deleted roles
   */
  async fetchAllRolesDeleted(page: number, searchText: string) {
    try {
      const roleCondition = {
        select: {
          uuid: true,
          role_name: true,
          slug: true,
          description: true,
          is_active: true,
        },
        where: {},
      };
      if (searchText) {
        roleCondition['where']['OR'] = [
          {
            role_name: {
              contains: searchText,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchText,
              mode: 'insensitive',
            },
          },
        ];
      }
      const roles = await this.roleRepository.findManyDeletedWithPaginate(
        roleCondition.select,
        roleCondition.where,
        page,
      );
      return {
        status: true,
        message: 'Roles fetched successfully.',
        data: roles,
      };
    } catch (err) {
      throw err;
    }
  }

  /**
   * @description
   * Function to find all roles for dropdown
   */
  async fetchAllRoleForDropdown() {
    try {
      const roles = await this.roleRepository.findMany(
        {
          uuid: true,
          role_name: true,
          slug: true,
        },
        {
          is_active: true,
        },
      );
      return {
        status: true,
        message: 'Roles fetched successfully.',
        data: roles,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to fetch all active roles Obj
   */
  async fetchAllRolesMeta() {
    try {
      const condition = {
        select: {
          uuid: true,
          role_name: true,
          slug: true,
          description: true,
        },
        where: {
          is_active: true,
        },
      };
      const roles: any = await this.roleRepository.findMany(
        condition.select,
        condition.where,
      );
      if (roles.length === 0) {
        throw new NotFoundException('No data found.');
      }
      // Creating rolesObj
      const rolesObj = roles.reduce((acc: any[], role: any) => {
        acc[role.uuid] = role;
        return acc;
      }, {});

      return {
        status: true,
        message: 'Roles fetched successfully.',
        data: { rolesObj },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to find particular role of given id
   */
  async findRoleById(uuid: string) {
    try {
      const select = {
        uuid: true,
        role_name: true,
        slug: true,
        description: true,
        is_active: true,
        role_permissions: {
          select: {
            id: true,
            permission_id: true,
            permission: {
              select: {
                id: true,
                permissions_name: true,
                slug: true,
                description: true,
                is_active: true,
              },
            },
          },
        },
      };
      const relation = {
        role_permissions: {
          include: {
            permission: true,
          },
        },
      };
      const relationWithSelect = {
        role_permissions: {
          select: {
            id: true,
            permission_id: true,
            role_id: true,
            permission: {
              select: {
                id: true,
                permissions_name: true,
                slug: true,
                description: true,
                is_active: true,
              },
            },
          },
        },
      };
      const role = await this.roleRepository.findOne(
        select,
        { uuid: uuid },
        relation,
      );
      if (!role) {
        throw new NotFoundException('Role information not found');
      }
      return {
        status: true,
        message: 'Role fetched successfully.',
        data: role,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to create role
   */
  async createRole(auth: any, payload: any) {
    try {
      //Checking role already exist
      const roleCondition = {
        select: {
          uuid: true,
          role_name: true,
          slug: true,
          is_deleted: true,
        },
        where: {
          OR: [{ role_name: payload.role_name }, { slug: payload.slug }],
        },
      };
      const role: any = await this.roleRepository.findOneWithoutDelete(
        roleCondition.select,
        roleCondition.where,
      );
      if (role && role.is_deleted === false) {
        throw new ConflictException(
          'Role with same name or slug already exists.',
        );
      }
      //Preparing role payload
      const rolePayload = {
        create: {
          role_name: payload.role_name,
          slug: payload.slug,
          description: payload.description,
          is_active: payload?.is_active === true ? true : false,
          created_by: auth?.id,
        },
        update: {
          description: payload.description,
          is_active: payload?.is_active === true ? true : false,
          updated_by: auth?.id,
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
        },
        where: {
          slug: payload.slug,
        },
      };
      const createdRole = await this.roleRepository.upsert(
        rolePayload.create,
        rolePayload.update,
        rolePayload.where,
      );
      if (createdRole) {
        //Once role created attaching permission
        if (payload.permissions) {
          const permissionPayload = {
            role_id: createdRole.id,
            permissions: payload.permissions,
          };
          await this.attachPermissionsToRole(auth, permissionPayload);
        }
        return { status: true, message: 'Role created successfully' };
      }
      throw new BadRequestException('Error while creating role.');
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to toggle role visibility
   */
  async toggleRoleVisibility(auth: any, uuid: string, payload: any) {
    try {
      //Checking role information exists or not
      const roleCondition = {
        select: {
          uuid: true,
        },
        where: {
          uuid: uuid,
        },
      };
      const role = await this.roleRepository.findOne(
        roleCondition.select,
        roleCondition.where,
      );
      if (!role) {
        throw new NotFoundException('Role information not found.');
      }
      const rolePayload = {
        ...payload,
        updated_by: auth.id,
      };
      this.roleRepository.update({ uuid: role.uuid }, rolePayload);
      return {
        status: true,
        message: 'Role visibility updated successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to update existing role
   */
  async updateRole(auth: any, uuid: string, payload: any) {
    try {
      //Checking role information exists or not
      const roleCondition = {
        select: {
          uuid: true,
          role_name: true,
          slug: true,
        },
        where: {
          uuid: uuid,
        },
      };
      const role = await this.roleRepository.findOne(
        roleCondition.select,
        roleCondition.where,
      );
      if (!role) {
        throw new NotFoundException('Role information not found.');
      }
      //Checking role already exist
      const anotherRoleWithSameNameAndSlug = await this.roleRepository.findOne(
        { id: true, role_name: true, slug: true },
        {
          OR: [{ role_name: payload.role_name }, { slug: payload.slug }],
          NOT: { uuid: uuid },
        },
      );
      if (anotherRoleWithSameNameAndSlug) {
        throw new ConflictException(
          'Role with same name or slug already exists.',
        );
      }
      //Preparing role payload
      const rolePayload = {
        role_name: payload.role_name,
        slug: payload.slug,
        description: payload.description,
        is_active: payload?.is_active === true ? true : false,
        updated_by: auth.id,
      };
      const updatedRole = await this.roleRepository.update({ uuid: uuid }, rolePayload);
      if (updatedRole) {
        //Once role created attaching permission
        if (payload.permissions) {
          const permissionPayload = {
            role_id: updatedRole.id,
            permissions: payload.permissions,
          };
          await this.attachPermissionsToRole(auth, permissionPayload);
        }
        return { status: true, message: 'Role updated successfully' };
      }
      throw new BadRequestException('Error while updating role.');
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to delete existing role
   */
  async deleteRole(auth: any, uuid: string) {
    try {
      //Checking role information exists or not
      const roleCondition = {
        select: {
          uuid: true,
          role_name: true,
          slug: true,
        },
        where: {
          uuid: uuid,
        },
      };
      const role = await this.roleRepository.findOne(
        roleCondition.select,
        roleCondition.where,
      );
      if (!role) {
        throw new NotFoundException('Role information not found.');
      }
      const rolePayload = {
        is_active: false,
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: auth?.id,
      };
      const deletedRole = await this.roleRepository.update({ uuid: uuid }, rolePayload);
      if (deletedRole) {
        return { status: true, message: 'Role deleted successfully' };
      }
      throw new BadRequestException('Error while deleting role.');
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to restore particular role of given id
   */
  async restoreRoleById(uuid: string) {
    try {
      //Checking role information exists or not
      const roleExist = await this.roleRepository.findOneWithoutDelete(
        { id: true, role_name: true, slug: true },
        { uuid: uuid, is_deleted: true },
      );
      if (!roleExist) {
        throw new NotFoundException('Role information not found.');
      }
      const rolePayload = {
        is_active: true,
        updated_at: new Date(),
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      };
      const restoredRole = await this.roleRepository.updateWithOutDeleted(
        { uuid: uuid },
        rolePayload,
      );
      if (restoredRole) {
        return {
          status: true,
          message: 'Role restored successfully.',
        };
      }
      throw new BadRequestException('Error while restoring role.');
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to attach permissions to particular role
   */
  async attachPermissionsToRole(auth: any, payload: any) {
    try {
      const permissionArr = JSON.parse(payload.permissions);
      if (permissionArr.length === 0) {
        return {
          status: false,
          message: 'Please provide valid permissions.',
        };
      }
      const rolePermissions = [];
      permissionArr.forEach((permission: number, permissionIndex: number) => {
        rolePermissions.push({
          role_id: payload.role_id,
          permission_id: permission,
          created_by: auth.id,
        });
      });
      await this.rolePermissionRepository.deattachPermissions({
        role_id: payload.role_id,
      });
      await this.rolePermissionRepository.attachPermissions(rolePermissions);
      return {
        status: true,
        message: 'Permission attached to role successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to fetch the permissions of requested roles by role ids
   */
  async fetchRolesPermissions(roleIds: any) {
    try {
      const parsedRoleIds = roleIds.split(',').map((id: string) => parseInt(id, 10));
      //Role permission condition
      const rolePermissionCondition = {
        select: {
          role_id: true,
          permission_id: true,
        },
        where: {
          role_id: {
            in: parsedRoleIds,
          },
        },
      };
      const rolePermisisions = await this.rolePermissionRepository.findMany(
        rolePermissionCondition.select,
        rolePermissionCondition.where,
      );
      if (rolePermisisions.length === 0) {
        return {
          status: false,
          message: 'Roles permissions not found.',
        };
      }
      const permisisionIds = this.commonHelper.pluck(
        rolePermisisions,
        'permission_id',
      );
      //Preparing permission condition
      const permissionCondition = {
        select: {
          id: true,
          permissions_name: true,
          slug: true,
          description: true,
          module: true,
          is_active: true,
        },
        where: {
          id: {
            in: permisisionIds,
          },
        },
      };
      const permissions = await this.permissionRepository.findMany(
        permissionCondition.select,
        permissionCondition.where,
      );
      const groupedPermission = this.commonHelper.arrayToKeyValueObject(
        permissions,
        'module',
      );
      return {
        status: true,
        message: 'Roles permissions fetched successfully.',
        data: groupedPermission,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description
   * Function to verify whether specified roles has particular permission or not
   */
  async verifyRolePermission(roleIds: any, permissionId: number) {
    const rolePermissionCondition = {
      select: {
        id: true,
        permission_id: true,
        role_id: true,
      },
      where: {
        role_id: { in: roleIds },
        permission_id: permissionId,
      },
    };
    const rolePermission = await this.rolePermissionRepository.findOne(
      rolePermissionCondition.select,
      rolePermissionCondition.where,
    );
    if (rolePermission) {
      return true;
    }
    return false;
  }
}
