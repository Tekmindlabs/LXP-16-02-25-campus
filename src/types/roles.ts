export interface RoleTemplate {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  settings: {
    isDefault: boolean;
    scope: 'global' | 'campus' | 'program';
    customizationOptions?: {
      allowPermissionModification: boolean;
      allowScopeModification: boolean;
      requiredPermissions: string[];
    };
  };
}
