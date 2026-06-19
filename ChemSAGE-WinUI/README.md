# ChemSAGE WinUI 3 Desktop Client

ChemSAGE-WinUI is a native Windows desktop client for the ChemSAGE academic platform. It is intentionally isolated in this top-level folder so the existing Next.js web application remains unchanged. The app targets WinUI 3, .NET 9, Windows App SDK, MVVM, dependency injection, HttpClient services, and the same Supabase backend contracts used by the website.

## What you get in this Phase 1 client

- Fluent WinUI 3 shell with `NavigationView`, Mica backdrop, native title-bar integration, and dark-mode-aware resources.
- MVVM view models using `CommunityToolkit.Mvvm`.
- Dependency injection and app composition through `Microsoft.Extensions.Hosting`.
- Supabase Auth, PostgREST, and RPC access through HttpClient service classes.
- Windows `PasswordVault` session persistence.
- Native file picker and toast notification services.
- Database-backed pages for Dashboard, Resource Vault, Past Papers, Study Circles, Tasks, Profile, Settings, and Admin Panel.

## Complete setup guide for a new Windows PC

These steps assume you have downloaded this repository but have not installed any Windows/.NET development tools yet.

### 1. Confirm Windows requirements

1. Use Windows 10 version 2004 or newer, or Windows 11.
2. Open **Settings → System → About** and confirm the OS build is `19041` or newer.
3. Install current Windows updates before installing Visual Studio.

### 2. Install Visual Studio and required workloads

1. Download **Visual Studio 2022 Community** from <https://visualstudio.microsoft.com/downloads/>.
2. Run the installer.
3. Select these workloads:
   - **.NET desktop development**
   - **Windows application development**
4. In **Individual components**, ensure these are selected:
   - **.NET 9 SDK**
   - **Windows App SDK C# templates**
   - **Windows 10 SDK 10.0.19041.0** or newer
   - **MSIX Packaging Tools**
5. Finish installation and restart Windows if prompted.

### 3. Get the code onto your PC

If you use Git:

```powershell
git clone https://github.com/YOUR_ORG_OR_USER/ChemSage.git
cd ChemSage\ChemSAGE-WinUI
```

If you downloaded a ZIP:

1. Right-click the ZIP and choose **Extract All**.
2. Open PowerShell in the extracted repository folder.
3. Change into the desktop project folder:

```powershell
cd .\ChemSAGE-WinUI
```

### 4. Configure Supabase and the web signup endpoint

Open `ChemSAGE-WinUI\appsettings.json` and replace the placeholder values:

```json
{
  "Supabase": {
    "Url": "https://YOUR_PROJECT_REF.supabase.co",
    "AnonKey": "YOUR_SUPABASE_ANON_KEY",
    "WebApiBaseUrl": "http://localhost:3000"
  }
}
```

Use the same public Supabase values as the web app:

- `Url`: Supabase Dashboard → Project Settings → API → Project URL.
- `AnonKey`: Supabase Dashboard → Project Settings → API → anon public key.
- `WebApiBaseUrl`: the running ChemSAGE web app URL. Use `http://localhost:3000` for local web development or your deployed website URL for shared environments.

Do not put the Supabase service-role key in this desktop app. Desktop signup calls the existing web `/api/auth/signup` endpoint so the server-side approval, roll-number validation, orphan-account repair, and admin notification logic remains centralized in the web/API tier.

### 5. Restore NuGet packages

From the `ChemSAGE-WinUI` folder, run:

```powershell
dotnet restore .\ChemSAGE-WinUI.sln
```

If `dotnet` is not recognized, close and reopen PowerShell after installing Visual Studio, or install the .NET 9 SDK from <https://dotnet.microsoft.com/download/dotnet/9.0>.

### 6. Build from the command line

```powershell
dotnet build .\ChemSAGE-WinUI.sln -c Debug -p:Platform=x64
```

A successful build produces the desktop app binaries under `bin\x64\Debug`.

### 7. Run from Visual Studio

1. Open `ChemSAGE-WinUI\ChemSAGE-WinUI.sln` in Visual Studio.
2. Select the `x64` solution platform.
3. Set `ChemSAGE-WinUI` as the startup project.
4. Press **F5** to debug or **Ctrl+F5** to run without debugging.

### 8. Run from the command line

```powershell
dotnet run --project .\ChemSAGE-WinUI.csproj -c Debug -p:Platform=x64
```

### 9. Sign in and verify data sync

1. Start the existing ChemSAGE web app if your `WebApiBaseUrl` points to `http://localhost:3000`.
2. Launch the WinUI app.
3. Sign in with an approved ChemSAGE user.
4. Open each navigation item and confirm data loads from Supabase:
   - Dashboard: profile summary and quick actions.
   - Resource Vault: active resources.
   - Past Papers: active exam papers.
   - Study Circles: public rooms except the global room.
   - Tasks: current user tasks and schedule.
   - Profile: current profile and profile analytics RPC data.
   - Settings: current user notifications.
   - Admin Panel: admin stats and orphan-user RPC results for admin users.

## Troubleshooting

| Problem | Fix |
|---|---|
| `dotnet` is not recognized | Install the .NET 9 SDK or reopen PowerShell after Visual Studio installation. |
| Build cannot find WinUI/Windows App SDK targets | Reopen Visual Studio Installer and add **Windows application development** plus Windows App SDK C# templates. |
| Mica or Windows App SDK runtime errors | Update Windows and install the latest Windows App Runtime through Visual Studio/Windows App SDK tooling. |
| Signup fails | Confirm `WebApiBaseUrl` points to a running ChemSAGE web app because signup is intentionally delegated to `/api/auth/signup`. |
| Sign-in succeeds but pages are empty | Confirm the Supabase anon key, RLS policies, and user approval status match the existing web app environment. |
| Admin Panel fails | Confirm the signed-in user has `role = 'admin'` and the database migrations defining admin RPC functions are applied. |

## Architecture decisions

- **WinUI 3 and Windows App SDK** provide native Windows UX, Fluent controls, Mica, NavigationView, file pickers, and app notifications.
- **MVVM with CommunityToolkit.Mvvm** keeps UI state and commands out of XAML code-behind.
- **Dependency injection** is configured in `App.xaml.cs` using `Microsoft.Extensions.Hosting` so services and view models can be expanded or tested independently.
- **Supabase integration** is implemented through HttpClient services rather than direct page-level HTTP calls.
- **Secure token storage** uses Windows `PasswordVault` so sessions are not stored as plaintext files.
- **Navigation** is centralized in `NavigationRegistry` and `NavigationService`; every requested page has dedicated wiring and a dedicated view model.

## Database parity

The Windows client includes typed coverage for these website-backed tables and RPC functions:

- Tables/views: `profiles`, `resources`, `exam_papers`, `rooms`, `tasks`, `schedule`, and `notifications`.
- RPC functions: `increment_download_count`, `get_admin_stats`, `get_orphan_users`, `repair_user`, `admin_update_user_status`, `admin_update_user_role`, and `get_profile_analytics`.

Advanced mutation-heavy workflows such as versioned resource uploads, realtime group chat, and bulk admin editing should build on these contracts in later phases instead of placing business logic in XAML code-behind.

## Migration roadmap

1. **Phase 1: Native shell and auth foundation** — authenticate against existing Supabase contracts and provide native navigation, secure storage, dashboard, and database-backed read surfaces.
2. **Phase 2: Shared contract hardening** — add generated contract tests to keep TypeScript DTOs, C# records, SQL projections, and RPC payloads in sync.
3. **Phase 3: Desktop Resource Vault and Past Papers** — add upload/download progress, offline-safe queues, file versioning, and Supabase Storage policy validation.
4. **Phase 4: Collaboration modules** — add Study Circles chat, realtime notifications, direct messages, task editing, and schedule editing.
5. **Phase 5: Hybrid operations** — keep Next.js as the web client and privileged API/server surface while WinUI consumes public Supabase/API contracts with versioning and release automation.

## Repository boundary

No existing web application files are modified by this desktop phase. Future shared-contract changes should be isolated and reviewed independently.
