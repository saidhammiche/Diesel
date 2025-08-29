import React, { useEffect, useState, useMemo } from "react";
import { Table, Layout, Typography, Select, Space, Button, Spin, Modal, InputNumber, message, notification } from "antd";
import { FilterOutlined, EditOutlined, CheckCircleTwoTone, SyncOutlined } from "@ant-design/icons";
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

function App() {
  const [allData, setAllData] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  // Charger toutes les données
  const fetchData = () => {
    setLoading(true);
    axios.get("http://localhost:5000/api/diesel")
      .then(res => {
        setAllData(res.data);
        const uniqueYears = [...new Set(res.data.map(item => item.Jahr))].sort((a, b) => b - a);
        setYears(uniqueYears);

        if (uniqueYears.includes(new Date().getFullYear())) {
          setSelectedYear(new Date().getFullYear());
        } else if (uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[0]);
        }
      })
      .catch(err => {
        console.error(err);
        message.error("Fehler beim Laden der Daten!");
      })
      .finally(() => {
        setLoading(false);
        setRefreshLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculer les totaux pour l'année sélectionnée
  const yearTotals = useMemo(() => {
    const yearData = allData.filter(item => item.Jahr === selectedYear);
    return {
      dieselLieferung: yearData.reduce((sum, item) => sum + (item.DieselLieferung || 0), 0),
      dieselLieferungKwh: yearData.reduce((sum, item) => sum + (item.DieselLieferungKwh || 0), 0),
      dieselkostenNetto: yearData.reduce((sum, item) => sum + (item.DieselkostenNetto || 0), 0),
    };
  }, [allData, selectedYear]);

  // Préparer les données pour le tableau avec la ligne de somme
  const tableData = useMemo(() => {
    const yearData = allData.filter(item => item.Jahr === selectedYear);
    
    // Trier les données par mois
    const sortedData = yearData.sort((a, b) => a.Monat - b.Monat);
    
    // Ajouter la ligne de somme à la fin
    return [
      ...sortedData,
      {
        DieselbezugMonatID: 'sum',
        Jahr: selectedYear,
        Monat: 'Summe',
        Monatname: 'Jahressumme',
        DieselLieferung: yearTotals.dieselLieferung,
        DieselLieferungKwh: yearTotals.dieselLieferungKwh,
        DieselkostenNetto: yearTotals.dieselkostenNetto,
      }
    ];
  }, [allData, selectedYear, yearTotals]);

  // Filtrage par année
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [selectedYear, allData]);

  // ✅ Notification de succès professionnelle
  const openSuccessNotification = () => {
    api.success({
      message: 'Erfolgreich gespeichert',
      description: 'Die Änderungen wurden erfolgreich übernommen und gespeichert.',
      icon: <CheckCircleTwoTone twoToneColor="#52c41a" />,
      placement: 'topRight',
      duration: 4.5,
    });
  };

  // ✅ Actualiser les données
  const handleRefresh = () => {
    setRefreshLoading(true);
    fetchData();
    
    // Message de confirmation
    message.success({
      content: (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <SyncOutlined spin style={{ marginRight: '8px', color: '#3b7695' }} />
          Daten werden aktualisiert...
        </span>
      ),
      duration: 2,
    });
  };

  // ✅ Sauvegarde
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`http://localhost:5000/api/diesel/${editRecord.DieselbezugMonatID}`, {
        lieferung: editRecord.DieselLieferung || 0,
        kwh: editRecord.DieselLieferungKwh || 0,
        kosten: editRecord.DieselkostenNetto || 0,
      });

      // Afficher la notification de succès
      openSuccessNotification();

      // Mettre à jour en local
      setAllData(prev =>
        prev.map(item =>
          item.DieselbezugMonatID === editRecord.DieselbezugMonatID ? editRecord : item
        )
      );

      setEditRecord(null);
    } catch (err) {
      message.error("❌ Fehler beim Speichern der Daten!");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { 
      title: "ID", 
      dataIndex: "DieselbezugMonatID", 
      key: "id",
      render: (text, record) => 
        record.DieselbezugMonatID === 'sum' ? '' : text
    },
    { title: "Jahr", dataIndex: "Jahr", key: "jahr" },
    { title: "Monat", dataIndex: "Monat", key: "monat" },
    { title: "Monatname", dataIndex: "Monatname", key: "monatname" },
    { 
      title: "Diesel Lieferung (L)", 
      dataIndex: "DieselLieferung", 
      key: "dieselL",
      render: (text, record) => {
        // Gérer les valeurs null
        const value = text || 0;
        return record.DieselbezugMonatID === 'sum' ? 
          <Text strong>{value.toLocaleString('de-DE')}</Text> : 
          value.toLocaleString('de-DE');
      }
    },
    { 
      title: "Diesel Lieferung (kWh)", 
      dataIndex: "DieselLieferungKwh", 
      key: "dieselKwh",
      render: (text, record) => {
        // Gérer les valeurs null
        const value = text || 0;
        return record.DieselbezugMonatID === 'sum' ? 
          <Text strong>{value.toLocaleString('de-DE')}</Text> : 
          value.toLocaleString('de-DE');
      }
    },
    { 
      title: "Dieselkosten (netto)", 
      dataIndex: "DieselkostenNetto", 
      key: "kosten",
      render: (text, record) => {
        // Gérer les valeurs null
        const value = text || 0;
        return record.DieselbezugMonatID === 'sum' ? 
          <Text strong>{value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</Text> : 
          value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
      }
    },
    {
      title: "Aktion",
      key: "aktion",
      render: (_, record) => 
        record.DieselbezugMonatID === 'sum' ? null : (
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => setEditRecord({ ...record })}
          >
            Bearbeiten
          </Button>
        )
    }
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {contextHolder}
      <Header style={{ 
        background: "white", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        padding: "0 24px"
      }}>
        <Title level={2} style={{ color: "#3b7695", margin: 0, fontWeight: 600 }}>
          📊 Dieselverbrauch Übersicht
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<SyncOutlined />} 
            loading={refreshLoading}
            onClick={handleRefresh}
            style={{ 
              backgroundColor: "#3b7695", 
              borderColor: "#3b7695",
              fontWeight: 500,
              height: "40px"
            }}
          >
            Daten Aktualisieren
          </Button>
          
          <Select
            value={selectedYear}
            style={{ 
              width: 150,
              height: "40px"
            }}
            onChange={(value) => setSelectedYear(value)}
            suffixIcon={<FilterOutlined style={{ color: "#3b7695" }} />}
            bordered={true}
            dropdownStyle={{ 
              backgroundColor: "#f0f8ff",
              border: "1px solid #3b7695"
            }}
          >
            {years.map(year => (
              <Option key={year} value={year} style={{ backgroundColor: "#f0f8ff" }}>
                {year}
              </Option>
            ))}
          </Select>
        </Space>
      </Header>

      <Content style={{ padding: "24px" }}>
        <Spin spinning={loading} tip="Laden...">
          <div style={{ 
            border: `2px solid #3b7695`, 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <Table 
              columns={columns} 
              dataSource={tableData} 
              rowKey="DieselbezugMonatID" 
              bordered 
              pagination={false}
              rowClassName={(record) => 
                record.DieselbezugMonatID === 'sum' ? 'sum-row' : ''
              }
            />
          </div>
        </Spin>
      </Content>

      {/* ✅ Modal d'édition */}
      <Modal
        title="Daten bearbeiten"
        open={!!editRecord}
        onCancel={() => setEditRecord(null)}
        onOk={handleSave}
        confirmLoading={saving}
        okText="Speichern"
        cancelText="Abbrechen"
        okButtonProps={{ style: { backgroundColor: '#3b7695', borderColor: '#3b7695' } }}
      >
        {editRecord && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <label>Diesel Lieferung (L):</label>
            <InputNumber 
              style={{ width: "100%" }}
              value={editRecord.DieselLieferung || 0}
              onChange={(val) => setEditRecord({ ...editRecord, DieselLieferung: val })}
            />
            <label>Diesel Lieferung (kWh):</label>
            <InputNumber 
              style={{ width: "100%" }}
              value={editRecord.DieselLieferungKwh || 0}
              onChange={(val) => setEditRecord({ ...editRecord, DieselLieferungKwh: val })}
            />
            <label>Dieselkosten (netto):</label>
            <InputNumber 
              style={{ width: "100%" }}
              value={editRecord.DieselkostenNetto || 0}
              onChange={(val) => setEditRecord({ ...editRecord, DieselkostenNetto: val })}
            />
          </Space>
        )}
      </Modal>

      <style>
        {`
          .sum-row {
            background-color: #e6f7ff !important;
            font-weight: bold;
          }
          .sum-row:hover td {
            background-color: #ccefff !important;
          }
        `}
      </style>
    </Layout>
  );
  
}

export default App;