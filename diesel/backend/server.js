const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
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

// ✅ Route : toutes les données avec alias (pas d'espaces dans les noms de colonnes)
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
        console.error("❌ Erreur SQL :", err);
        res.status(500).send("Erreur serveur");
    }
});

// ✅ Route : mise à jour d'une ligne
app.put("/api/diesel/:id", async (req, res) => {
    const { id } = req.params;
    const { lieferung, kwh, kosten } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("id", sql.Int, id)
            .input("lieferung", sql.Float, lieferung)
            .input("kwh", sql.Float, kwh)
            .input("kosten", sql.Float, kosten)
            .query(`
                UPDATE DieselbezugMonat
                SET [Diesel Lieferung] = @lieferung,
                    [Diesel Lieferung kwh] = @kwh,
                    [Dieselkosten (netto)] = @kosten
                WHERE DieselbezugMonatID = @id
            `);

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Erreur SQL Update :", err);
        res.status(500).send("Erreur serveur lors de la mise à jour");
    }
});


// 🚀 Lancer serveur
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});
