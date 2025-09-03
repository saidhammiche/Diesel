const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors({
   
}));
app.use(express.json());

// ⚙️ Config SQL Server
const dbConfig = {
    user: "emonitor",
    password: "ELfG-2014",
    server: "20.52.39.176",
    database: "MRS_BI",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// ✅ Route : toutes les données DieselbezugMonat
app.get("/api/diesel", async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`
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
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Erreur SQL Dieselbezug :", err);
        res.status(500).send("Erreur serveur");
    }
});

// ✅ Route : mise à jour d'une ligne DieselbezugMonat
app.put("/api/diesel/:id", async (req, res) => {
    const { id } = req.params;
    const { lieferung, kwh, kosten } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("id", sql.Int, id)
            .input("lieferung", sql.Decimal(18, 1), lieferung)
            .input("kwh", sql.Decimal(18, 1), kwh)
            .input("kosten", sql.Decimal(18, 1), kosten)
            .query(`
                UPDATE DieselbezugMonat
                SET [Diesel Lieferung] = @lieferung,
                    [Diesel Lieferung kwh] = @kwh,
                    [Dieselkosten (netto)] = @kosten
                WHERE DieselbezugMonatID = @id
            `);

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Erreur SQL Update Dieselbezug :", err);
        res.status(500).send("Erreur serveur lors de la mise à jour");
    }
});

// ✅ Route : toutes les données DieselverbrauchMonat
app.get("/api/diesel-verbrauch", async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`
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
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Erreur SQL Dieselverbrauch :", err);
        res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
});

// ✅ Route : mise à jour d'une ligne DieselverbrauchMonat
app.put("/api/diesel-verbrauch/:id", async (req, res) => {
    const { id } = req.params;
    const { 
        dieselverbrauchSumme, 
        bagger904, 
        bagger316, 
        radlader, 
        stapler75t, 
        stapler25t 
    } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("id", sql.Int, id)
            .input("dieselverbrauchSumme", sql.Decimal(18, 1), dieselverbrauchSumme)
            .input("bagger904", sql.Decimal(18, 1), bagger904)
            .input("bagger316", sql.Decimal(18, 1), bagger316)
            .input("radlader", sql.Decimal(18, 1), radlader)
            .input("stapler75t", sql.Decimal(18, 1), stapler75t)
            .input("stapler25t", sql.Decimal(18, 1), stapler25t)
            .query(`
                UPDATE DieselverbrauchMonat
                SET [Dieselverbr. Summe Einzeldoku] = @dieselverbrauchSumme,
                    [Bagger 904 (Nr. 6)] = @bagger904,
                    [Bagger 316 (Nr. 7)] = @bagger316,
                    [Radlader (Nr. 5)] = @radlader,
                    [7,5t Stapler (Nr. 4)] = @stapler75t,
                    [2,5t Stapler (Nr. 1)] = @stapler25t
                WHERE DieselverbrauchMonatID = @id
            `);

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Erreur SQL Update Dieselverbrauch :", err);
        res.status(500).json({ error: "Erreur serveur lors de la mise à jour", details: err.message });
    }
});

// 🚀 Route de test pour vérifier la connexion à la table
app.get("/api/test-dieselverbrauch", async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`
            SELECT TOP 5 * FROM DieselverbrauchMonat
        `);
        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });
    } catch (err) {
        console.error("❌ Erreur test Dieselverbrauch :", err);
        res.status(500).json({ 
            error: "Erreur test", 
            details: err.message,
            config: dbConfig
        });
    }
});

// 🚀 Lancer serveur
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});