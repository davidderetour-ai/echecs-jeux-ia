import SwiftUI
import AppKit
import Combine

/// Compagnon local macOS 11 (Big Sur).
/// Ne lit ni certificat iPhone, ni Apple ID, ni données AltStore privées.
/// Le statut AltServer décrit seulement la présence du processus sur ce Mac.
@main
struct AliciaRenewalMacApp: App {
    var body: some Scene {
        WindowGroup("Alicia — Renouvellement iPhone") {
            RenewalView()
                .frame(minWidth: 500, minHeight: 510)
        }
    }
}

struct RenewalView: View {
    @AppStorage("aliciaIphoneExpiryManuallyObserved") private var expirySeconds = 0.0
    @State private var chosenDate: Date = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
    @State private var altServerRunning = false
    @State private var checkedAt = Date()
    @State private var warning = ""
    @State private var lastAction = ""

    private let timer = Timer.publish(every: 30, on: .main, in: .common).autoconnect()
    private let gradient = LinearGradient(
        gradient: Gradient(colors: [Color(red: 0.09, green: 0.14, blue: 0.33),
                                   Color(red: 0.05, green: 0.09, blue: 0.20)]),
        startPoint: .topLeading, endPoint: .bottomTrailing
    )

    private var expiry: Date? {
        expirySeconds > 0 ? Date(timeIntervalSince1970: expirySeconds) : nil
    }

    private var daysLeft: Int? {
        guard let date = expiry else { return nil }
        let today = Calendar.current.startOfDay(for: Date())
        let end = Calendar.current.startOfDay(for: date)
        return Calendar.current.dateComponents([.day], from: today, to: end).day
    }

    private var expiryText: String {
        guard let days = daysLeft else { return "Date iPhone non renseignée" }
        if days < 0 { return "Date saisie dépassée : vérifier AltStore" }
        if days == 0 { return "Échéance saisie : aujourd’hui" }
        if days == 1 { return "1 jour restant (date saisie)" }
        return String(days) + " jours restants (date saisie)"
    }

    private var expiryColor: Color {
        guard let days = daysLeft else { return .yellow }
        return days <= 2 ? .orange : .green
    }

    private func updateStatus() {
        altServerRunning = NSWorkspace.shared.runningApplications.contains { app in
            (app.localizedName ?? "").localizedCaseInsensitiveContains("AltServer")
            || (app.bundleIdentifier ?? "").localizedCaseInsensitiveContains("altserver")
        }
        checkedAt = Date()
    }

    private func openAltServer() {
        let paths = [
            "/Applications/AltServer.app",
            NSHomeDirectory() + "/Applications/AltServer.app"
        ]
        guard let path = paths.first(where: { FileManager.default.fileExists(atPath: $0) })
        else {
            warning = "AltServer n’a pas été trouvé dans Applications. Installe-le depuis altstore.io."
            return
        }
        if !NSWorkspace.shared.open(URL(fileURLWithPath: path)) {
            warning = "Impossible d’ouvrir AltServer. Vérifie son installation."
        } else {
            warning = "AltServer a été demandé au système. Son état sera revérifié."
        }
    }

    private func saveDate() {
        expirySeconds = chosenDate.timeIntervalSince1970
        lastAction = "Date saisie enregistrée sur le Mac — vérifie-la dans AltStore sur l’iPhone."
    }

    private func openHelp() {
        guard let url = URL(string: "https://faq.altstore.io/altstore-classic/how-to-install-altstore-macos")
        else { return }
        NSWorkspace.shared.open(url)
    }

    var body: some View {
        ZStack {
            gradient.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack {
                        Image(systemName: "sparkles")
                            .font(.system(size: 29))
                            .foregroundColor(.cyan)
                        VStack(alignment: .leading) {
                            Text("ALICIA — MAC")
                                .font(.title2).bold()
                            Text("Renouvellement de l’application iPhone")
                                .font(.caption).foregroundColor(.white.opacity(0.78))
                        }
                        Spacer()
                        Text("macOS 11+")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.7))
                    }

                    card {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Image(systemName: "desktopcomputer")
                                    .foregroundColor(altServerRunning ? .green : .orange)
                                Text("AltServer sur ce Mac").font(.headline)
                                Spacer()
                                Circle()
                                    .fill(altServerRunning ? Color.green : Color.orange)
                                    .frame(width: 11, height: 11)
                            }
                            Text(altServerRunning
                                ? "Processus AltServer détecté"
                                : "Processus AltServer non détecté")
                                .font(.subheadline).bold()
                            Text("Ceci ne confirme PAS une connexion à l’iPhone ni un renouvellement réussi.")
                                .font(.caption).foregroundColor(.white.opacity(0.78))
                            HStack {
                                Button("Ouvrir AltServer", action: openAltServer)
                                Button("Revérifier", action: updateStatus)
                            }
                            if !warning.isEmpty {
                                Text(warning).font(.caption).foregroundColor(.yellow)
                            }
                        }
                    }

                    card {
                        VStack(alignment: .leading, spacing: 13) {
                            HStack {
                                Image(systemName: "iphone").foregroundColor(.cyan)
                                Text("Signature d’Alicia sur iPhone").font(.headline)
                            }
                            Text(expiryText)
                                .font(.title3).bold().foregroundColor(expiryColor)
                            if let exp = expiry {
                                Text("Date relevée : " + DateFormatter.localizedString(
                                    from: exp, dateStyle: .medium, timeStyle: .none
                                ))
                                .font(.caption).foregroundColor(.white.opacity(0.8))
                            }
                            DatePicker(
                                "Date d’expiration affichée dans AltStore",
                                selection: $chosenDate,
                                displayedComponents: .date
                            )
                            .datePickerStyle(CompactDatePickerStyle())
                            Button("Enregistrer la date vérifiée", action: saveDate)
                            if !lastAction.isEmpty {
                                Text(lastAction).font(.caption).foregroundColor(.green)
                            }
                        }
                    }

                    card {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Renouvellement automatique").font(.headline)
                            Text("AltStore peut tenter le renouvellement en arrière-plan si le Mac "
                                + "reste allumé, AltServer est lancé, et l’iPhone communique avec "
                                + "le Mac via le même Wi-Fi ou USB.")
                                .font(.subheadline)
                            Text("Le Mac n’a pas besoin d’une nouvelle signature tous les 7 jours. "
                                + "Seule l’application iPhone est concernée.")
                                .font(.caption).foregroundColor(.white.opacity(0.8))
                            Text("La date saisie ici n’est pas synchronisée avec l’iPhone : "
                                + "elle doit être corrigée après vérification dans AltStore.")
                                .font(.caption).foregroundColor(.yellow)
                            Button("Instructions officielles AltStore", action: openHelp)
                        }
                    }
                }
                .padding(21)
            }
        }
        .foregroundColor(.white)
        .onAppear {
            if let exp = expiry { chosenDate = exp }
            updateStatus()
        }
        .onReceive(timer) { _ in updateStatus() }
    }

    private func card<Content: View>(
        @ViewBuilder content: () -> Content
    ) -> some View {
        content()
            .padding(17)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(red: 0.11, green: 0.17, blue: 0.33).opacity(0.97))
            .cornerRadius(17)
            .overlay(RoundedRectangle(cornerRadius: 17)
                .stroke(Color(red: 0.38, green: 0.49, blue: 0.72), lineWidth: 1))
    }
}
