<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bulletin de Paie - {{ $employee->first_name }} {{ $employee->last_name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 15px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 5px;
        }
        .company-info {
            font-size: 10px;
            color: #666;
        }
        .payslip-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
            color: #333;
        }
        .info-section {
            margin-bottom: 20px;
        }
        .info-section h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #4f46e5;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .info-grid {
            display: table;
            width: 100%;
        }
        .info-row {
            display: table-row;
        }
        .info-label {
            display: table-cell;
            width: 40%;
            padding: 5px 10px 5px 0;
            font-weight: 600;
            color: #555;
        }
        .info-value {
            display: table-cell;
            width: 60%;
            padding: 5px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 8px 10px;
            text-align: left;
            border: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        .amount {
            text-align: right;
            font-family: 'Courier New', Courier, monospace;
        }
        .total-row {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .signature-section {
            margin-top: 40px;
            display: table;
            width: 100%;
        }
        .signature-box {
            display: table-cell;
            width: 50%;
            text-align: center;
            padding: 20px;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 10px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="company-name">{{ $company_name }}</div>
            <div class="company-info">
                {{ $company_address }} | {{ $company_phone }} | {{ $company_email }}
            </div>
        </div>

        <div class="payslip-title">
            BULLETIN DE PAIE - {{ strtoupper(Carbon\Carbon::parse($salary->month . '-01')->format('F Y')) }}
        </div>

        <div class="info-section">
            <h3>Informations Employé</h3>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-label">Nom complet</div>
                    <div class="info-value">{{ $employee->first_name }} {{ $employee->last_name }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Matricule</div>
                    <div class="info-value">{{ $employee->employee_id }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Département</div>
                    <div class="info-value">{{ $department->name ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Poste</div>
                    <div class="info-value">{{ $employee->position }}</div>
                </div>
            </div>
        </div>

        <div class="info-section">
            <h3>Détails du Salaire</h3>
            <table>
                <thead>
                    <tr>
                        <th>Libellé</th>
                        <th class="amount">Montant (MAD)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Salaire Brut</td>
                        <td class="amount">{{ number_format($salary->gross_amount, 2, ',', ' ') }}</td>
                    </tr>
                    <tr>
                        <td>Prime</td>
                        <td class="amount">{{ number_format($salary->bonus ?? 0, 2, ',', ' ') }}</td>
                    </tr>
                    <tr>
                        <td>Salaire Brut Total</td>
                        <td class="amount"><strong>{{ number_format($salary->gross_amount + ($salary->bonus ?? 0), 2, ',', ' ') }}</strong></td>
                    </tr>
                </tbody>
            </table>

            <table>
                <thead>
                    <tr>
                        <th>Retenues</th>
                        <th class="amount">Montant (MAD)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Impôt sur le revenu (IR)</td>
                        <td class="amount">{{ number_format($salary->tax_amount, 2, ',', ' ') }}</td>
                    </tr>
                    <tr>
                        <td>Autres déductions</td>
                        <td class="amount">{{ number_format($salary->deductions ?? 0, 2, ',', ' ') }}</td>
                    </tr>
                </tbody>
            </table>

            <table>
                <thead>
                    <tr>
                        <th>Net à Payer</th>
                        <th class="amount">{{ number_format($salary->net_amount, 2, ',', ' ') }} MAD</th>
                    </tr>
                </thead>
            </table>
        </div>

        <div class="info-section">
            <h3>Informations de Paiement</h3>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-label">Mois de paie</div>
                    <div class="info-value">{{ Carbon\Carbon::parse($salary->month . '-01')->format('F Y') }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Date de paiement</div>
                    <div class="info-value">{{ $salary->payment_date ? Carbon\Carbon::parse($salary->payment_date)->format('d/m/Y') : 'Non défini' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Mode de paiement</div>
                    <div class="info-value">{{ ucfirst($salary->payment_method ?? 'Non défini') }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Statut</div>
                    <div class="info-value">{{ ucfirst($salary->status) }}</div>
                </div>
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">
                    Signature de l'employé
                </div>
            </div>
            <div class="signature-box">
                <div class="signature-line">
                    Cachet et signature du responsable
                </div>
            </div>
        </div>

        <div class="footer">
            Document généré le {{ Carbon\Carbon::parse($generated_date)->format('d/m/Y à H:i') }} | {{ $company_name }} - Tous droits réservés
        </div>
    </div>
</body>
</html>
