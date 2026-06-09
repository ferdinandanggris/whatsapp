# UsersView Upgrade — Implementation

## 1. Backend: `handler/user.go`
- Add `updateUserRequest.IsActive *bool`
- Add `resetPasswordRequest` struct
- Update `Update` handler: if `req.IsActive != nil`, pass to `UpdateUser`
- Add `ResetPassword` handler: validate body, hash password, call `UpdatePassword`
- Import `log/slog` + `service`

## 2. Backend: `repository/user.go`
- Update `UpdateUser` signature: `(ctx, id, role, displayName string, companyID *int64, isActive *bool)`
- If `isActive != nil`, include `is_active = $5` in UPDATE query

## 3. Backend: `cmd/server/main.go`
- Add `r.Post("/users/{id}/reset-password", userHandler.ResetPassword)` in `RequireRole("super_admin", "company_admin")` group

## 4. Desktop: `IApiClient.cs`
- Add `Task ResetPasswordAsync(string id, string newPassword)`

## 5. Desktop: `ApiClient.cs`
- Implement `ResetPasswordAsync` → `POST /api/v1/users/{id}/reset-password`

## 6. Desktop: `UsersView.Designer.cs`
- Replace `Columns.Add("Role", "Role")` with `DataGridViewComboBoxColumn colRole` (items: super_admin, admin, agent)
- Replace `Columns.Add("Status", "Status")` with `DataGridViewCheckBoxColumn colStatus`
- Add `DataGridViewButtonColumn colReset` (HeaderText: "Reset", Text: "Reset", UseColumnTextForButtonValue: true, ReadOnly: true)
- Wire `CellContentClick` event
- Remove `btnSave`, `btnRefresh`, `btnSearch` — keep `btnSave`, `btnRefresh`, `btnSearch` as is

## 7. Desktop: `UsersView.cs`
- Add `private static readonly Dictionary<string, string> RoleDisplayMap`
- `DataSource.set`: map `company_admin` → `admin` display; set `colStatus.Value = u.IsActive`
- `GetModifiedRows()`: reverse-map `admin` → `company_admin`; read `colStatus.Value as bool?`
- Add `event EventHandler<string> ResetPasswordClicked` — fires with user ID
- `CellContentClick`: detect `colReset` column → get user ID from row → confirm dialog → fire event
- Keep existing yellow highlight logic for all editable cells

## 8. Desktop: `UsersPresenter.cs`
- Wire `ResetPasswordClicked` → `api.ResetPasswordAsync(id, "WaClientDefault123?")`
- In `OnSaveClicked`: pass `IsActive` to `UpdateUserAsync`
- Create flow: default password `"WaClientDefault123?"` hardcoded
