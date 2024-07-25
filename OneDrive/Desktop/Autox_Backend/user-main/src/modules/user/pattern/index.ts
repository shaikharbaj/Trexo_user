export const USER_PATTERN = {
  TCP: {
    findUserByConditionForLogin: {
      role: "findUserByConditionForLogin",
      cmd: "find-user-by-condition-for-login",
    },
    verifyUserPermission: {
      role: "verifyUserPermission",
      cmd: "verify-user-permission",
    },
    registerBuyer: { role: "registerBuyer", cmd: "register-buyer" },
    findBuyerForLogin: {
      role: "findBuyerForLogin",
      cmd: "find-buyer-for-login",
    },
    sendBuyerRegisterOTP: {
      role: "sendBuyerRegisterOTP",
      cmd: "send-buyer-register-otp",
    },
    verifyBuyerRegisterOTP: {
      role: "verifyBuyerRegisterOTP",
      cmd: "verify-buyer-register-otp",
    },
  },
  KAFKA: {
    findUserByConditionForLogin: "findUserByConditionForLogin",
    verifyUserPermission: "verifyUserPermission",
    registerBuyer: "registerBuyer",
    findBuyerForLogin: "findBuyerForLogin",
    sendBuyerRegisterOTP: "sendBuyerRegisterOTP",
    verifyBuyerRegisterOTP: "verifyBuyerRegisterOTP",
  },
  REDIS: {},
  RABBITMQ: {},
};

export const ADMIN_PATTERN = {
  TCP: {
    findAdminUserForLogin: {
      role: "findAdminUserForLogin",
      cmd: "find-admin-user-for-login",
    },
    fetchAllAdminUser: {
      role: "fetchAllAdminUser",
      cmd: "fetch-all-admin-user",
    },
    fetchAllDeletedAdminUser: {
      role: "fetchAllDeletedAdminUser",
      cmd: "fetch-all-deleted-admin-user",
    },
    fetchAllAdminUserForDropdown: {
      role: "fetchAllAdminUserForDropdown",
      cmd: "fetch-all-admin-user-for-dropdown",
    },
    findAdminUserById: {
      role: "findAdminUserById",
      cmd: "find-admin-user-by-id",
    },
    createAdminUser: { role: "createAdminUser", cmd: "create-admin-user" },
    toggleAdminUserVisibility: {
      role: "toggleAdminUserVisibility",
      cmd: "toggle-admin-user-visibility",
    },
    updateAdminUser: { role: "updateAdminUser", cmd: "update-admin-user" },
    deleteAdminUser: { role: "deleteAdminUser", cmd: "delete-admin-user" },
    restoreAdminUser: { role: "restoreAdminUser", cmd: "restore-admin-user" },
  },
  KAFKA: {
    findAdminUserForLogin: "findAdminUserForLogin",
    fetchAllAdminUser: "fetchAllAdminUser",
    fetchAllDeletedAdminUser: "fetchAllDeletedAdminUser",
    fetchAllAdminUserForDropdown: "fetchAllAdminUserForDropdown",
    findAdminUserById: "findAdminUserById",
    createAdminUser: "createAdminUser",
    toggleAdminUserVisibility: "toggleAdminUserVisibility",
    updateAdminUser: "updateAdminUser",
    deleteAdminUser: "deleteAdminUser",
    restoreAdminUser: "restoreAdminUser",
  },
  REDIS: {},
  RABBITMQ: {},
};
