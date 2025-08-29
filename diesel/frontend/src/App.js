import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Table, Layout, Typography, Select, Space, Button, Spin, Modal, InputNumber, message, notification, Tabs } from "antd";
import { FilterOutlined, EditOutlined, CheckCircleTwoTone, SyncOutlined } from "@ant-design/icons";
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

function App() {
  const [allData, setAllData] = useState([]);
  const [verbrauchData, setVerbrauchData] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [yearLoading, setYearLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("dieselbezug");
  const [api, contextHolder] = notification.useNotification();

  // --- Charger données Dieselbezug ---
  const fetchDiesel = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/diesel");
      setAllData(res.data);
      const uniqueYears = [...new Set(res.data.map(item => item.Jahr))].sort((a, b) => b - a);
      setYears(uniqueYears);
      if (!uniqueYears.includes(selectedYear)) setSelectedYear(uniqueYears[0]);
    } catch (err) {
      console.error(err);
      message.error("Fehler beim Laden der Dieselbezug-Daten!");
    } finally {
      setLoading(false);
      setRefreshLoading(false);
      setYearLoading(false);
    }
  };

  // --- Charger données Dieselverbrauch ---
  const fetchVerbrauch = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/diesel-verbrauch");
      setVerbrauchData(res.data);
    } catch (err) {
      console.error(err);
      message.error("Fehler beim Laden der Dieselverbrauch-Daten!");
    } finally {
      setLoading(false);
      setRefreshLoading(false);
      setYearLoading(false);
    }
  };

  // Utilisation de useCallback pour mémoriser fetchAll
  const fetchAll = useCallback(() => {
    fetchDiesel();
    fetchVerbrauch();
  }, []); // Les dépendances vides signifient que fetchAll ne changera pas

  useEffect(() => { 
    fetchAll(); 
  }, [fetchAll]); // Maintenant fetchAll est une dépendance stable

  // --- Totaux Dieselbezug ---
  const yearTotals = useMemo(() => {
    const yearData = allData.filter(item => item.Jahr === selectedYear);
    return {
      dieselLieferung: yearData.reduce((sum, item) => sum + (item.DieselLieferung || 0), 0),
      dieselLieferungKwh: yearData.reduce((sum, item) => sum + (item.DieselLieferungKwh || 0), 0),
      dieselkostenNetto: yearData.reduce((sum, item) => sum + (item.DieselkostenNetto || 0), 0),
    };
  }, [allData, selectedYear]);

  // --- Totaux Dieselverbrauch ---
  const verbrauchTotals = useMemo(() => {
    const yearData = verbrauchData.filter(item => item.Jahr === selectedYear);
    return {
      dieselverbrauchSumme: yearData.reduce((sum, item) => sum + (item.DieselverbrauchSumme || 0), 0),
      bagger904: yearData.reduce((sum, item) => sum + (item.Bagger904 || 0), 0),
      bagger316: yearData.reduce((sum, item) => sum + (item.Bagger316 || 0), 0),
      radlader: yearData.reduce((sum, item) => sum + (item.Radlader || 0), 0),
      stapler75t: yearData.reduce((sum, item) => sum + (item.Stapler75t || 0), 0),
      stapler25t: yearData.reduce((sum, item) => sum + (item.Stapler25t || 0), 0),
    };
  }, [verbrauchData, selectedYear]);

  // --- Table data avec ligne de somme ---
  const dieselTableData = useMemo(() => {
    const sorted = allData.filter(item => item.Jahr === selectedYear).sort((a,b)=>a.Monat-b.Monat);
    return [...sorted, { DieselbezugMonatID:'sum', Jahr:selectedYear, Monat:'Summe', Monatname:'Jahressumme', ...yearTotals }];
  }, [allData, selectedYear, yearTotals]);

  const verbrauchTableData = useMemo(() => {
    const sorted = verbrauchData.filter(item => item.Jahr === selectedYear).sort((a,b)=>a.Monat-b.Monat);
    return [...sorted, { DieselverbrauchMonatID:'sum', Jahr:selectedYear, Monat:'Summe', Monatname:'Jahressumme', ...verbrauchTotals }];
  }, [verbrauchData, selectedYear, verbrauchTotals]);

  // --- Notifications ---
  const openSuccessNotification = () => {
    api.success({
      message: 'Erfolgreich gespeichert',
      description: 'Die Änderungen wurden erfolgreich übernommen und gespeichert.',
      icon: <CheckCircleTwoTone twoToneColor="#52c41a" />,
      placement: 'topRight',
      duration: 3.5,
    });
  };

  // --- Rafraîchir toutes les données ---
  const handleRefresh = () => { setRefreshLoading(true); fetchAll(); };

  // --- Changer d'année avec spinner ---
  const handleYearChange = (year) => { setSelectedYear(year); setYearLoading(true); setTimeout(()=>setYearLoading(false), 500); };

  // --- Sauvegarder modifications ---
  const handleSave = async () => {
    if(!editRecord) return;
    setSaving(true);
    try {
      if(activeTab==="dieselbezug") {
        await axios.put(`http://localhost:5000/api/diesel/${editRecord.DieselbezugMonatID}`, {
          lieferung: editRecord.DieselLieferung || 0,
          kwh: editRecord.DieselLieferungKwh || 0,
          kosten: editRecord.DieselkostenNetto || 0
        });
      } else {
        await axios.put(`http://localhost:5000/api/diesel-verbrauch/${editRecord.DieselverbrauchMonatID}`, {
          dieselverbrauchSumme: editRecord.DieselverbrauchSumme || 0,
          bagger904: editRecord.Bagger904 || 0,
          bagger316: editRecord.Bagger316 || 0,
          radlader: editRecord.Radlader || 0,
          stapler75t: editRecord.Stapler75t || 0,
          stapler25t: editRecord.Stapler25t || 0
        });
      }
      openSuccessNotification();
      fetchAll();
      setEditRecord(null);
    } catch(err) {
      console.error(err);
      message.error("Fehler beim Speichern der Daten!");
    } finally { setSaving(false); }
  };

  // --- Colonnes Dieselbezug ---
  const dieselColumns = [
    { title:"ID", dataIndex:"DieselbezugMonatID", render:(text,record)=>record.DieselbezugMonatID==='sum'?'':text },
    { title:"Jahr", dataIndex:"Jahr" },
    { title:"Monat", dataIndex:"Monat" },
    { title:"Monatname", dataIndex:"Monatname" },
    { title:"Diesel Lieferung (L)", dataIndex:"DieselLieferung", render:(text,record)=>record.DieselbezugMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"Diesel Lieferung (kWh)", dataIndex:"DieselLieferungKwh", render:(text,record)=>record.DieselbezugMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"Dieselkosten (netto)", dataIndex:"DieselkostenNetto", render:(text,record)=>record.DieselbezugMonatID==='sum'?<Text strong>{(text||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'})}</Text>:(text||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'}) },
    { title:"Aktion", render:(_,record)=>record.DieselbezugMonatID==='sum'?null:<Button type="primary" icon={<EditOutlined />} onClick={()=>setEditRecord({...record})}>Bearbeiten</Button> }
  ];

  // --- Colonnes Dieselverbrauch ---
  const verbrauchColumns = [
    { title:"ID", dataIndex:"DieselverbrauchMonatID", render:(text,record)=>record.DieselverbrauchMonatID==='sum'?'':text },
    { title:"Jahr", dataIndex:"Jahr" },
    { title:"Monat", dataIndex:"Monat" },
    { title:"Monatname", dataIndex:"Monatname" },
    { title:"Dieselverbrauch Summe", dataIndex:"DieselverbrauchSumme" },
    { title:"Bagger 904", dataIndex:"Bagger904" },
    { title:"Bagger 316", dataIndex:"Bagger316" },
    { title:"Radlader", dataIndex:"Radlader" },
    { title:"7,5t Stapler", dataIndex:"Stapler75t" },
    { title:"2,5t Stapler", dataIndex:"Stapler25t" },
    { title:"Aktion", render:(_,record)=>record.DieselverbrauchMonatID==='sum'?null:<Button type="primary" icon={<EditOutlined />} onClick={()=>setEditRecord({...record})}>Bearbeiten</Button> }
  ];

  return (
    <Layout style={{ minHeight:"100vh" }}>
      {contextHolder}
      <Header style={{ background:"white", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
        <Title level={2} style={{ color:"#3b7695", margin:0, fontWeight:600 }}>📊 Dieselverbrauch Übersicht</Title>
        <Space>
          <Button type="primary" icon={<SyncOutlined />} loading={refreshLoading} onClick={handleRefresh} style={{ backgroundColor:"#3b7695", borderColor:"#3b7695", fontWeight:500, height:"40px" }}>Daten Aktualisieren</Button>
          <Select value={selectedYear} style={{ width:150, height:"40px" }} onChange={handleYearChange} suffixIcon={<FilterOutlined style={{ color:"#3b7695" }} />}>
            {years.map(y=><Option key={y} value={y}>{y}</Option>)}
          </Select>
        </Space>
      </Header>

      <Content style={{ padding:"24px" }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="line" size="large" style={{ marginBottom:24 }}>
          <TabPane tab={<span><i className="fas fa-gas-pump" style={{marginRight: 8, color: "#3b7695"}}></i>Dieselbezug</span>} key="dieselbezug">
            <Spin spinning={loading || saving || yearLoading} tip={<span style={{ color:"#3b7695", fontWeight:600 }}>Laden / Speichern...</span>} size="large">
              <div style={{ border:"2px solid #3b7695", borderRadius:"6px", overflow:"hidden", boxShadow:"0 2px 6px rgba(0,0,0,0.05)" }}>
                <Table columns={dieselColumns} dataSource={dieselTableData} rowKey="DieselbezugMonatID" bordered pagination={false} rowClassName={r=>r.DieselbezugMonatID==='sum'?'sum-row':''} scroll={{x:true}} />
              </div>
            </Spin>
          </TabPane>

          <TabPane tab={<span><i className="fas fa-chart-line" style={{marginRight: 8, color: "#3b7695"}}></i>Dieselverbrauch</span>} key="dieselverbrauch">
            <Spin spinning={loading || saving || yearLoading} tip={<span style={{ color:"#3b7695", fontWeight:600 }}>Laden / Speichern...</span>} size="large">
              <div style={{ border:"2px solid #3b7695", borderRadius:"6px", overflow:"hidden", boxShadow:"0 2px 6px rgba(0,0,0,0.05)" }}>
                <Table columns={verbrauchColumns} dataSource={verbrauchTableData} rowKey="DieselverbrauchMonatID" bordered pagination={false} rowClassName={r=>r.DieselverbrauchMonatID==='sum'?'sum-row':''} scroll={{x:true}} />
              </div>
            </Spin>
          </TabPane>
        </Tabs>
      </Content>

      {/* --- Modal édition --- */}
      <Modal title="Daten bearbeiten" open={!!editRecord} onCancel={()=>setEditRecord(null)} onOk={handleSave} confirmLoading={saving} okText="Speichern" cancelText="Abbrechen" okButtonProps={{ style:{ backgroundColor:'#3b7695', borderColor:'#3b7695' } }}>
        {editRecord && <Space direction="vertical" style={{ width:"100%" }}>
          {activeTab==="dieselbezug"?(
            <>
              <label>Diesel Lieferung (L):</label>
              <InputNumber style={{ width:"100%" }} value={editRecord.DieselLieferung||0} onChange={val=>setEditRecord({...editRecord, DieselLieferung:val})} />
              <label>Diesel Lieferung (kWh):</label>
              <InputNumber style={{ width:"100%" }} value={editRecord.DieselLieferungKwh||0} onChange={val=>setEditRecord({...editRecord, DieselLieferungKwh:val})} />
              <label>Dieselkosten (netto):</label>
              <InputNumber style={{ width:"100%" }} value={editRecord.DieselkostenNetto||0} onChange={val=>setEditRecord({...editRecord, DieselkostenNetto:val})} />
            </>
          ):(
            <>
              <label>Dieselverbrauch Summe:</label>
              <InputNumber style={{ width:"100%" }} value={editRecord.DieselverbrauchSumme||0} onChange={val=>setEditRecord({...editRecord, DieselverbrauchSumme:val})} />
              <label>Bagger 904:</label>
              <InputNumber style={{ width:"100%" }} value={editRecord.Bagger904||0} onChange={val=>setEditRecord({...editRecord, Bagger904:val})} />
              <label>Bagger 316:</label>
              <InputNumber style={{ width:"100%" }} value={editRecord.Bagger316||0} onChange={val=>setEditRecord({...editRecord, Bagger316:val})} />
              <label>Radlader:</label>
              <InputNumber style={{ width:"100%" }} value={editRecord.Radlader||0} onChange={val=>setEditRecord({...editRecord, Radlader:val})} />
              <label>7,5t Stapler:</label>
              <InputNumber style={{ width:"100%" }} value={editRecord.Stapler75t||0} onChange={val=>setEditRecord({...editRecord, Stapler75t:val})} />
              <label>2,5t Stapler:</label>
              <InputNumber style={{ width:"100%" }} value={editRecord.Stapler25t||0} onChange={val=>setEditRecord({...editRecord, Stapler25t:val})} />
            </>
          )}
        </Space>}
      </Modal>

      <style>
        {`
          .sum-row { background-color:#f8f9fa !important; font-weight:bold; }
          .sum-row:hover td { background-color:#e9ecef !important; }
          .ant-table-thead > tr > th { background-color:#3b7695; font-weight:600; color:white; }
          .ant-tabs-tab-active { border-bottom: 2px solid #3b7695 !important; }
          .ant-tabs-tab-active .ant-tabs-tab-btn { color: #3b7695 !important; font-weight: 600; }
          .ant-tabs-ink-bar { background: #3b7695 !important; }
        `}
      </style>
      
      {/* Font Awesome pour les icônes professionnelles */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </Layout>
  );
}

export default App;