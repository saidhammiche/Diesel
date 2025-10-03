const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ⚙️ Config SQL Server avec pool
const dbConfig = {
    user: "emonitor",
    password: "ELfG-2014",
    server: "20.52.39.176",
    database: "MRS_BI",
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

// --- Fonction utilitaire pour exécuter des requêtes
async function executeQuery(query, inputs = {}) {
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const request = pool.request();
        for (const key in inputs) {
            request.input(key, inputs[key].type, inputs[key].value);
        }
        const result = await request.query(query);
        return result.recordset;
    } catch (err) {
        throw err;
    }
}

// ================= ROUTES =================

// ✅ Dieselbezug
app.get("/api/diesel", async (req, res) => {
    try {
        const data = await executeQuery(`
            SELECT 
                DieselbezugMonatID,
                Jahr,
                Monat,
                Monatname,
                [Diesel Lieferung] AS DieselLieferung,
                [Diesel Lieferung kwh] AS DieselLieferungKwh,
                [Dieselkosten (netto)] AS DieselkostenNetto
            FROM DieselbezugMonat
            ORDER BY Jahr DESC, Monat ASC
        `);
        res.json(data);
    } catch (err) { res.status(500).send(err.message); }
});

app.put("/api/diesel/:id", async (req, res) => {
    const { id } = req.params;
    const { lieferung, kwh, kosten } = req.body;
    try {
        await executeQuery(`
            UPDATE DieselbezugMonat
            SET [Diesel Lieferung] = @lieferung,
                [Diesel Lieferung kwh] = @kwh,
                [Dieselkosten (netto)] = @kosten
            WHERE DieselbezugMonatID = @id
        `, {
            id: { type: sql.Int, value: id },
            lieferung: { type: sql.Decimal(18,1), value: lieferung },
            kwh: { type: sql.Decimal(18,1), value: kwh },
            kosten: { type: sql.Decimal(18,1), value: kosten }
        });
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// POST pour ajouter une nouvelle ligne Dieselbezug
app.post("/api/diesel", async (req, res) => {
    const { Jahr, Monat, DieselLieferung, DieselLieferungKwh, DieselkostenNetto } = req.body;
    try {
        await executeQuery(`
            INSERT INTO DieselbezugMonat (Jahr, Monat, [Diesel Lieferung], [Diesel Lieferung kwh], [Dieselkosten (netto)])
            VALUES (@Jahr, @Monat, @DieselLieferung, @DieselLieferungKwh, @DieselkostenNetto)
        `, {
            Jahr: { type: sql.Int, value: Jahr },
            Monat: { type: sql.Int, value: Monat },
            DieselLieferung: { type: sql.Decimal(18,1), value: DieselLieferung },
            DieselLieferungKwh: { type: sql.Decimal(18,1), value: DieselLieferungKwh },
            DieselkostenNetto: { type: sql.Decimal(18,1), value: DieselkostenNetto }
        });
        res.json({ success: true, message: "Neue Dieselbezug-Daten hinzugefügt" });
    } catch (err) { res.status(500).send(err.message); }
});

// ✅ Dieselverbrauch
app.get("/api/diesel-verbrauch", async (req, res) => {
    try {
        const data = await executeQuery(`
            SELECT 
                DieselverbrauchMonatID,
                Jahr,
                Monat,
                Monatname,
                [Dieselverbr. Summe Einzeldoku] AS DieselverbrauchSumme,
                [Bagger 904 (Nr. 6)] AS Bagger904,
                [Bagger 316 (Nr. 7)] AS Bagger316,
                [Radlader (Nr. 5)] AS Radlader,
                [7,5t Stapler (Nr. 4)] AS Stapler75t,
                [2,5t Stapler (Nr. 1)] AS Stapler25t
            FROM DieselverbrauchMonat
            ORDER BY Jahr DESC, Monat ASC
        `);
        res.json(data);
    } catch (err) { res.status(500).send(err.message); }
});

app.put("/api/diesel-verbrauch/:id", async (req, res) => {
    const { id } = req.params;
    const { dieselverbrauchSumme, bagger904, bagger316, radlader, stapler75t, stapler25t } = req.body;
    try {
        await executeQuery(`
            UPDATE DieselverbrauchMonat
            SET [Dieselverbr. Summe Einzeldoku] = @dieselverbrauchSumme,
                [Bagger 904 (Nr. 6)] = @bagger904,
                [Bagger 316 (Nr. 7)] = @bagger316,
                [Radlader (Nr. 5)] = @radlader,
                [7,5t Stapler (Nr. 4)] = @stapler75t,
                [2,5t Stapler (Nr. 1)] = @stapler25t
            WHERE DieselverbrauchMonatID = @id
        `, {
            id: { type: sql.Int, value: id },
            dieselverbrauchSumme: { type: sql.Decimal(18,1), value: dieselverbrauchSumme },
            bagger904: { type: sql.Decimal(18,1), value: bagger904 },
            bagger316: { type: sql.Decimal(18,1), value: bagger316 },
            radlader: { type: sql.Decimal(18,1), value: radlader },
            stapler75t: { type: sql.Decimal(18,1), value: stapler75t },
            stapler25t: { type: sql.Decimal(18,1), value: stapler25t }
        });
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// POST pour ajouter une nouvelle ligne Dieselverbrauch
app.post("/api/diesel-verbrauch", async (req, res) => {
    const { Jahr, Monat, DieselverbrauchSumme, Bagger904, Bagger316, Radlader, Stapler75t, Stapler25t } = req.body;
    try {
        await executeQuery(`
            INSERT INTO DieselverbrauchMonat 
            (Jahr, Monat, [Dieselverbr. Summe Einzeldoku], [Bagger 904 (Nr. 6)], [Bagger 316 (Nr. 7)], [Radlader (Nr. 5)], [7,5t Stapler (Nr. 4)], [2,5t Stapler (Nr. 1)])
            VALUES (@Jahr, @Monat, @DieselverbrauchSumme, @Bagger904, @Bagger316, @Radlader, @Stapler75t, @Stapler25t)
        `, {
            Jahr: { type: sql.Int, value: Jahr },
            Monat: { type: sql.Int, value: Monat },
            DieselverbrauchSumme: { type: sql.Decimal(18,1), value: DieselverbrauchSumme },
            Bagger904: { type: sql.Decimal(18,1), value: Bagger904 },
            Bagger316: { type: sql.Decimal(18,1), value: Bagger316 },
            Radlader: { type: sql.Decimal(18,1), value: Radlader },
            Stapler75t: { type: sql.Decimal(18,1), value: Stapler75t },
            Stapler25t: { type: sql.Decimal(18,1), value: Stapler25t }
        });
        res.json({ success: true, message: "Neue Dieselverbrauch-Daten hinzugefügt" });
    } catch (err) { res.status(500).send(err.message); }
});

// 🚀 Démarrage serveur
const PORT = 5000;
app.listen(PORT, () => console.log(`Server läuft auf http://localhost:${PORT}`));
