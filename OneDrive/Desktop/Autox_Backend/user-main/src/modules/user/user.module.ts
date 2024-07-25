import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { PrismaModule } from "../prisma/prisma.module";
import { PermissionModule } from "../permission/permission.module";
import { RoleModule } from "../role/role.module";
import { SerialNumberConfigurationModule } from "../serial-number-configiration/serial-number-configuration.module";
import { UserController } from "./user.controller";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { UserService } from "./user.service";
import {
  UserRepository,
  AuthRepository,
  UserRoleRepository,
} from "./repository";
import { CommonHelper, SecurityHelper } from "src/common/helpers";
import { OtpRepository } from "./repository/otp.repository";

@Module({
  imports: [
    PrismaModule,
    PermissionModule,
    RoleModule,
    SerialNumberConfigurationModule,
  ],
  controllers: [AdminController, UserController],
  providers: [
    AdminService,
    UserService,
    AuthRepository,
    UserRepository,
    UserRoleRepository,
    CommonHelper,
    SecurityHelper,
    OtpRepository,
  ],
  exports: [AdminService, UserService],
})
export class UserModule {}
