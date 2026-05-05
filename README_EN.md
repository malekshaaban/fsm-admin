# Developer Guide: Field Service Management App  🛠️👨‍💻

This documentation is intended for developers to understand the technical architecture, workflows, and the future roadmap of the Android application.

## 🏗️ Technical Architecture
The application follows the **MVVM (Model-View-ViewModel)** architectural pattern, utilizing **Jetpack Compose** for a modern, declarative UI.

### Core Components:
*   **Networking:** Powered by **Retrofit** and **OkHttp**. 
    *   `authInterceptor`: Dynamically injects the JWT token into every request header.
    *   `authFailureInterceptor`: Monitors for 401/403 responses to trigger automatic session invalidation.
*   **Navigation:** Uses **Compose Navigation**. The `NavHost` in `MainActivity` includes specific thread-safety handling to ensure navigation events are always executed on the **Main (UI) Thread**.
*   **State Management:** ViewModels utilize `MutableStateFlow` to provide reactive, lifecycle-aware state updates to the UI.
*   **Persistence:** `SharedPreferences` managed via the `SessionManager` class to persist JWT tokens, user roles, and profile details.

---

## 🔄 User Workflows (Technical Perspective)

### 1. Authentication & Session Management
*   **Login:** Upon successful authentication, a JWT is received and stored in `SessionManager`. The `RetrofitClient` is immediately updated with the new token.
*   **Profile Fetch:** Post-login, the app calls `/me` to fetch full user details (Role, City, Account Status).
*   **Banning System:** If an admin bans a user, the backend returns a **403 Forbidden**. The app's network interceptor catches this globally, clears the local session, and redirects the user to the Login screen immediately.

### 2. Customer Workflow
*   **Job Posting:** Sends a POST request with job details.
*   **Application Management:** Fetches job applications. The backend has been optimized (using Eager Loading) to prevent `LazyInitializationException` during JSON serialization of user entities.
*   **Actions:** Accept/Reject actions are handled via PATCH requests to update application status.

### 3. Technician Workflow
*   **Job Discovery:** Fetches open jobs filtered by the technician's city.
*   **Task Tracking:** A "My Tasks" screen specifically for jobs where the technician has been accepted. Allows updating task status to "Completed".

---

## 🛠️ Critical Technical Implementations

*   **Thread Safety:** Resolved `IllegalStateException` crashes by wrapping navigation calls in `kotlinx.coroutines.MainScope().launch` within the network interceptors.
*   **Differentiated Error Handling:** `AuthViewModel` distinguishes between "Invalid Credentials" (401) and "Banned Account" (403) to provide accurate user feedback.
*   **Design System:** Implemented a custom Material 3 theme using a "FieldBlack" and "FieldGold" color palette for a premium aesthetic.

---

## 🗺️ Future Roadmap: Maps & PostGIS Integration

The next major phase involves leveraging the existing **PostGIS** database capabilities:

### 1. Backend (PostgreSQL + PostGIS):
*   Implement `ST_DistanceSphere` to find technicians near a job location.
*   Convert location fields from `String` to `GEOMETRY(Point, 4326)`.

### 2. Android (Google Maps SDK):
*   **Integration:** Add `google-maps-compose` library.
*   **Geofencing:** Dynamically request `ACCESS_FINE_LOCATION` permissions.
*   **Features:** 
    *   Display available technicians as Markers on a map.
    *   "Pin Drop" location selection for customers when posting jobs.
    *   Distance calculation between technicians and job sites.

---

## 🛠️ Setup & Running the Project

### 1. Backend & Database (Docker)
The backend requires a PostgreSQL database with PostGIS. The easiest way to run it is via Docker:
*   **Run the Database & Backend:**
    ```bash
    docker compose up -d
    ```
*   **Reset the Database (Clear all data):**
    If you need to wipe the database and start fresh, run:
    ```bash
    docker compose down -v
    docker compose up -d
    ```

### 2. Android App (USB Debugging)
To run the app on a physical Android device:
1.  **Enable Developer Options:** Go to `Settings > About Phone` and tap `Build Number` 7 times.
2.  **Enable USB Debugging:** In `Developer Options`, toggle on `USB Debugging`.
3.  **ADB Reverse Port Mapping:** 
    Since the app connects to `localhost:8080`, you must forward your phone's port to your computer's port by running this command in your terminal:
    ```bash
    adb reverse tcp:8080 tcp:8080
    ```
    *(Note: Ensure `adb` is added to your System Environment Variables/PATH)*.

### 3. Admin Dashboard (Web)
To run the admin web portal:
1.  Open the `fsm-frontend` project in VS Code.
2.  Open the terminal and install dependencies (if not already done): `npm install`.
3.  Start the development server:
    ```bash
    npm run dev
    ```

---
## 🗺️ Future Roadmap: Maps & PostGIS Integration

The next major phase involves leveraging the existing **PostGIS** database capabilities:

### 1. Backend (PostgreSQL + PostGIS):
*   Implement `ST_DistanceSphere` to find technicians near a job location.
*   Convert location fields from `String` to `GEOMETRY(Point, 4326)`.

### 2. Android (Google Maps SDK):
*   **Integration:** Add `google-maps-compose` library.
*   **Geofencing:** Dynamically request `ACCESS_FINE_LOCATION` permissions.
*   **Features:** 
    *   Display available technicians as Markers on a map.
    *   "Pin Drop" location selection for customers when posting jobs.
    *   Distance calculation between technicians and job sites.
