import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Table, Layout, Typography, Select, Space, Button, Spin, Modal, InputNumber, message, notification, Tabs, Input, Form, Card } from "antd";
import { 
  FilterOutlined, 
  EditOutlined, 
  CheckCircleTwoTone, 
  SyncOutlined, 
  PlusCircleOutlined, 
  DashboardOutlined, 
  BarChartOutlined, 
  CalendarOutlined, 
  CalculatorOutlined, 
  DollarOutlined, 
  ToolOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Item } = Form;

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
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newRecord, setNewRecord] = useState({});
  const [activeTab, setActiveTab] = useState("dieselbezug");
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();

  // --- Charger données Dieselbezug ---
  const fetchDiesel = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://48.209.33.37:5011/api/diesel");
      setAllData(res.data);
      const uniqueYears = [...new Set(res.data.map(item => item.Jahr))].sort((a, b) => b - a);
      setYears(uniqueYears);
      if (!uniqueYears.includes(selectedYear) && uniqueYears.length > 0) {
        setSelectedYear(uniqueYears[0]);
      }
    } catch (err) {
      console.error(err);
      message.error("Fehler beim Laden der Dieselbezug-Daten!");
    } finally {
      setLoading(false);
      setRefreshLoading(false);
      setYearLoading(false);
    }
  }, [selectedYear]);

  // --- Charger données Dieselverbrauch ---
  const fetchVerbrauch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://48.209.33.37:5011/api/diesel-verbrauch");
      setVerbrauchData(res.data);
    } catch (err) {
      console.error(err);
      message.error("Fehler beim Laden der Dieselverbrauch-Daten!");
    } finally {
      setLoading(false);
      setRefreshLoading(false);
      setYearLoading(false);
    }
  }, []);

  const fetchAll = useCallback(() => {
    fetchDiesel();
    fetchVerbrauch();
  }, [fetchDiesel, fetchVerbrauch]);

  useEffect(() => { 
    fetchAll(); 
  }, [fetchAll]);

  // --- Totaux ---
  const yearTotals = useMemo(() => {
    const yearData = allData.filter(item => item.Jahr === selectedYear);
    return {
      dieselLieferung: yearData.reduce((sum, item) => sum + (item.DieselLieferung || 0), 0),
      dieselLieferungKwh: yearData.reduce((sum, item) => sum + (item.DieselLieferungKwh || 0), 0),
      dieselkostenNetto: yearData.reduce((sum, item) => sum + (item.DieselkostenNetto || 0), 0),
    };
  }, [allData, selectedYear]);

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

  const dieselTableData = useMemo(() => {
    const sorted = allData.filter(item => item.Jahr === selectedYear).sort((a,b)=>a.Monat-b.Monat);
    const sumRow = { 
      DieselbezugMonatID: 'sum', 
      Jahr: selectedYear, 
      Monat: 'Summe', 
      Monatname: 'Jahressumme', 
      DieselLieferung: yearTotals.dieselLieferung,
      DieselLieferungKwh: yearTotals.dieselLieferungKwh,
      DieselkostenNetto: yearTotals.dieselkostenNetto
    };
    return [...sorted, sumRow];
  }, [allData, selectedYear, yearTotals]);

  const verbrauchTableData = useMemo(() => {
    const sorted = verbrauchData.filter(item => item.Jahr === selectedYear).sort((a,b)=>a.Monat-b.Monat);
    const sumRow = {
      DieselverbrauchMonatID: 'sum',
      Jahr: selectedYear,
      Monat: 'Summe',
      Monatname: 'Jahressumme',
      DieselverbrauchSumme: verbrauchTotals.dieselverbrauchSumme,
      Bagger904: verbrauchTotals.bagger904,
      Bagger316: verbrauchTotals.bagger316,
      Radlader: verbrauchTotals.radlader,
      Stapler75t: verbrauchTotals.stapler75t,
      Stapler25t: verbrauchTotals.stapler25t
    };
    return [...sorted, sumRow];
  }, [verbrauchData, selectedYear, verbrauchTotals]);

  const openSuccessNotification = useCallback((message, description) => {
    api.success({
      message: message,
      description: description,
      icon: <CheckCircleTwoTone twoToneColor="#52c41a" />,
      placement: 'topRight',
      duration: 4.5,
      style: {
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f',
      }
    });
  }, [api]);

  const handleRefresh = useCallback(() => { 
    setRefreshLoading(true); 
    fetchAll(); 
  }, [fetchAll]);

  const handleYearChange = useCallback((year) => { 
    setSelectedYear(year); 
    setYearLoading(true); 
    setTimeout(()=>setYearLoading(false), 500); 
  }, []);

  const handleSave = useCallback(async () => {
    if(!editRecord) return;
    setSaving(true);
    try {
      if(activeTab==="dieselbezug") {
        await axios.put(`http://48.209.33.37:5011/api/diesel/${editRecord.DieselbezugMonatID}`, {
          lieferung: editRecord.DieselLieferung || 0,
          kwh: editRecord.DieselLieferungKwh || 0,
          kosten: editRecord.DieselkostenNetto || 0
        });
      } else {
        await axios.put(`http://48.209.33.37:5011/api/diesel-verbrauch/${editRecord.DieselverbrauchMonatID}`, {
          dieselverbrauchSumme: editRecord.DieselverbrauchSumme || 0,
          bagger904: editRecord.Bagger904 || 0,
          bagger316: editRecord.Bagger316 || 0,
          radlader: editRecord.Radlader || 0,
          stapler75t: editRecord.Stapler75t || 0,
          stapler25t: editRecord.Stapler25t || 0
        });
      }
      openSuccessNotification(
        "Daten erfolgreich aktualisiert", 
        `Die Änderungen für ${editRecord.Monatname} ${editRecord.Jahr} wurden erfolgreich im System gespeichert.`
      );
      fetchAll();
      setEditRecord(null);
    } catch(err) {
      console.error(err);
      message.error("Fehler beim Speichern der Daten!");
    } finally { setSaving(false); }
  }, [editRecord, activeTab, openSuccessNotification, fetchAll]);

  // --- Colonnes ---
  const dieselColumns = useMemo(() => [
    { title:"Jahr", dataIndex:"Jahr" },
    { title:"Monat", dataIndex:"Monat" },
    { title:"Monatname", dataIndex:"Monatname" },
    { title:"Diesel Lieferung (L)", dataIndex:"DieselLieferung", render:(text,record)=>record.DieselbezugMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"Diesel Lieferung (kWh)", dataIndex:"DieselLieferungKwh", render:(text,record)=>record.DieselbezugMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"Dieselkosten (netto)", dataIndex:"DieselkostenNetto", render:(text,record)=>record.DieselbezugMonatID==='sum'?<Text strong>{(text||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'})}</Text>:(text||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'}) },
    { title:"Aktion", render:(_,record)=>record.DieselbezugMonatID==='sum'?null:<Button type="primary" icon={<EditOutlined />} onClick={()=>setEditRecord({...record})}>Bearbeiten</Button> }
  ], []);

  const verbrauchColumns = useMemo(() => [
    { title:"Jahr", dataIndex:"Jahr" },
    { title:"Monat", dataIndex:"Monat" },
    { title:"Monatname", dataIndex:"Monatname" },
    { title:"Dieselverbrauch Summe (Liter)", dataIndex:"DieselverbrauchSumme", render:(text,record)=>record.DieselverbrauchMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"Bagger 904 (Liter)", dataIndex:"Bagger904", render:(text,record)=>record.DieselverbrauchMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"Bagger 316 (Liter)", dataIndex:"Bagger316", render:(text,record)=>record.DieselverbrauchMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"Radlader (Liter)", dataIndex:"Radlader", render:(text,record)=>record.DieselverbrauchMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"7,5t Stapler (Liter)", dataIndex:"Stapler75t", render:(text,record)=>record.DieselverbrauchMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"2,5t Stapler (Liter)", dataIndex:"Stapler25t", render:(text,record)=>record.DieselverbrauchMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"Aktion", render:(_,record)=>record.DieselverbrauchMonatID==='sum'?null:<Button type="primary" icon={<EditOutlined />} onClick={()=>setEditRecord({...record})}>Bearbeiten</Button> }
  ], []);

  // --- Ajout nouvelle ligne ---
  const handleAddNew = async () => {
    try {
      if(activeTab==="dieselbezug"){
        await axios.post("http://48.209.33.37:5011/api/diesel", newRecord);
        openSuccessNotification(
          "Neue Dieselbezug-Daten erfolgreich erfasst",
          `Die Daten für ${months.find(m => m.num === newRecord.Monat)?.name} ${newRecord.Jahr} wurden erfolgreich im System hinzugefügt.`
        );
      } else {
        await axios.post("http://48.209.33.37:5011/api/diesel-verbrauch", newRecord);
        openSuccessNotification(
          "Neue Dieselverbrauch-Daten erfolgreich erfasst",
          `Die Verbrauchsdaten für ${months.find(m => m.num === newRecord.Monat)?.name} ${newRecord.Jahr} wurden erfolgreich im System hinzugefügt.`
        );
      }
      setAddModalVisible(false);
      setNewRecord({});
      form.resetFields();
      fetchAll();
    } catch(err){
      console.error(err);
      message.error("Fehler beim Hinzufügen der Daten!");
    }
  };

  // --- Mois pour Select ---
  const months = [
    { num:1, name:"Januar"},{ num:2, name:"Februar"},{ num:3, name:"März"},{ num:4, name:"April"},
    { num:5, name:"Mai"},{ num:6, name:"Juni"},{ num:7, name:"Juli"},{ num:8, name:"August"},
    { num:9, name:"September"},{ num:10, name:"Oktober"},{ num:11, name:"November"},{ num:12, name:"Dezember"}
  ];

  return (
    <Layout style={{ minHeight:"100vh" }}>
      {contextHolder}
      <Header style={{ background:"white", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
        <Title level={2} style={{ color:"#3b7695", margin:0, fontWeight:600 }}><DashboardOutlined style={{ marginRight: 12 }} />Dieselverbrauch Übersicht</Title>
        <Space>
          <Button type="primary" icon={<SyncOutlined />} loading={refreshLoading} onClick={handleRefresh} style={{ backgroundColor:"#3b7695", borderColor:"#3b7695", fontWeight:500, height:"40px" }}>Daten Aktualisieren</Button>
          <Select value={selectedYear} style={{ width:150, height:"40px" }} onChange={handleYearChange} suffixIcon={<FilterOutlined style={{ color:"#3b7695" }} />}>
            {years.map(y=><Option key={y} value={y}>{y}</Option>)}
          </Select>
        </Space>
      </Header>

      <Content style={{ padding:"24px" }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="line" size="large" style={{ marginBottom:24 }}>
          <TabPane tab={<span><DashboardOutlined style={{marginRight: 8, color: "#3b7695"}} />Dieselbezug</span>} key="dieselbezug">
            <Space style={{ marginBottom:16 }}>
              <Button type="primary" icon={<PlusCircleOutlined />} onClick={()=>setAddModalVisible(true)} style={{ backgroundColor: "#1890ff", borderColor: "#1890ff", height: "40px", fontWeight: 600 }}>
                Neue Monatswerte erfassen
              </Button>
            </Space>
            <Spin spinning={loading || saving || yearLoading} tip={<span style={{ color:"#3b7695", fontWeight:600 }}>Laden / Speichern...</span>} size="large">
              <div style={{ border:"2px solid #3b7695", borderRadius:"6px", overflow:"hidden", boxShadow:"0 2px 6px rgba(0,0,0,0.05)" }}>
                <Table columns={dieselColumns} dataSource={dieselTableData} rowKey="DieselbezugMonatID" bordered pagination={false} rowClassName={r=>r.DieselbezugMonatID==='sum'?'sum-row':''} scroll={{x:true}} />
              </div>
            </Spin>
          </TabPane>

          <TabPane tab={<span><BarChartOutlined style={{marginRight: 8, color: "#3b7695"}} />Dieselverbrauch</span>} key="dieselverbrauch">
            <Space style={{ marginBottom:16 }}>
              <Button type="primary" icon={<PlusCircleOutlined />} onClick={()=>setAddModalVisible(true)} style={{ backgroundColor: "#1890ff", borderColor: "#1890ff", height: "40px", fontWeight: 600 }}>
                Neue Monatswerte erfassen
              </Button>
            </Space>
            <Spin spinning={loading || saving || yearLoading} tip={<span style={{ color:"#3b7695", fontWeight:600 }}>Laden / Speichern...</span>} size="large">
              <div style={{ border:"2px solid #3b7695", borderRadius:"6px", overflow:"hidden", boxShadow:"0 2px 6px rgba(0,0,0,0.05)" }}>
                <Table columns={verbrauchColumns} dataSource={verbrauchTableData} rowKey="DieselverbrauchMonatID" bordered pagination={false} rowClassName={r=>r.DieselverbrauchMonatID==='sum'?'sum-row':''} scroll={{x:true}} />
              </div>
            </Spin>
          </TabPane>
        </Tabs>
      </Content>

      {/* --- Modal édition --- */}
      <Modal 
        title={<span style={{ color: "#3b7695", fontWeight: 600, fontSize: "18px" }}><EditOutlined style={{ marginRight: 8 }} />Daten bearbeiten</span>} 
        open={!!editRecord} 
        onCancel={()=>setEditRecord(null)} 
        onOk={handleSave} 
        confirmLoading={saving} 
        okText="Speichern" 
        cancelText="Abbrechen" 
        okButtonProps={{ style:{ backgroundColor:'#3b7695', borderColor:'#3b7695', height: '40px' } }}
        cancelButtonProps={{ style: { height: '40px' } }}
        width={600}
      >
        {editRecord && (
          <div style={{ padding: '16px 0' }}>
            <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#f0f8ff', border: '1px solid #d6e4ff' }}>
              <Text style={{ color: '#3b7695', fontSize: '14px' }}>
                <CalculatorOutlined style={{ marginRight: 8 }} />
                {activeTab === "dieselbezug" 
                  ? `Aktualisieren Sie die Dieselbezug-Daten für ${editRecord.Monatname} ${editRecord.Jahr} - Alle Änderungen werden direkt im System gespeichert.`
                  : `Aktualisieren Sie die Dieselverbrauch-Daten für ${editRecord.Monatname} ${editRecord.Jahr} - Alle Änderungen werden direkt im System gespeichert.`
                }
              </Text>
            </Card>
            
            <Form layout="vertical">
              {activeTab === "dieselbezug" ? (
                <>
                  <Item label={<span><DashboardOutlined style={{ marginRight: 8, color: "#3b7695" }} />Diesel Lieferung (Liter)</span>}>
                    <InputNumber 
                      style={{ width: "100%" }} 
                      size="large"
                      value={editRecord.DieselLieferung} 
                      onChange={v=>setEditRecord({...editRecord, DieselLieferung:v})}
                      placeholder="Geben Sie die Dieselmenge in Litern ein"
                    />
                  </Item>
                  <Item label={<span><ThunderboltOutlined style={{ marginRight: 8, color: "#3b7695" }} />Diesel Lieferung (kWh)</span>}>
                    <InputNumber 
                      style={{ width: "100%" }} 
                      size="large"
                      value={editRecord.DieselLieferungKwh} 
                      onChange={v=>setEditRecord({...editRecord, DieselLieferungKwh:v})}
                      placeholder="Geben Sie die Energie in kWh ein"
                    />
                  </Item>
                  <Item label={<span><DollarOutlined style={{ marginRight: 8, color: "#3b7695" }} />Dieselkosten netto (€)</span>}>
                    <InputNumber 
                      style={{ width: "100%" }} 
                      size="large"
                      value={editRecord.DieselkostenNetto} 
                      onChange={v=>setEditRecord({...editRecord, DieselkostenNetto:v})}
                      placeholder="Geben Sie die Nettokosten ein"
                      step={0.01}
                    />
                  </Item>
                </>
              ) : (
                <>
                  <Item label={<span><DashboardOutlined style={{ marginRight: 8, color: "#3b7695" }} />Dieselverbrauch Gesamt (Liter)</span>}>
                    <InputNumber 
                      style={{ width: "100%" }} 
                      size="large"
                      value={editRecord.DieselverbrauchSumme} 
                      onChange={v=>setEditRecord({...editRecord, DieselverbrauchSumme:v})}
                      placeholder="Gesamter Dieselverbrauch in Litern"
                    />
                  </Item>
                  <Item label={<span><ToolOutlined style={{ marginRight: 8, color: "#3b7695" }} />Bagger 904 (Liter)</span>}>
                    <InputNumber 
                      style={{ width: "100%" }} 
                      size="large"
                      value={editRecord.Bagger904} 
                      onChange={v=>setEditRecord({...editRecord, Bagger904:v})}
                      placeholder="Verbrauch Bagger 904 in Litern"
                    />
                  </Item>
                  <Item label={<span><ToolOutlined style={{ marginRight: 8, color: "#3b7695" }} />Bagger 316 (Liter)</span>}>
                    <InputNumber 
                      style={{ width: "100%" }} 
                      size="large"
                      value={editRecord.Bagger316} 
                      onChange={v=>setEditRecord({...editRecord, Bagger316:v})}
                      placeholder="Verbrauch Bagger 316 in Litern"
                    />
                  </Item>
                  <Item label={<span><ToolOutlined style={{ marginRight: 8, color: "#3b7695" }} />Radlader (Liter)</span>}>
                    <InputNumber 
                      style={{ width: "100%" }} 
                      size="large"
                      value={editRecord.Radlader} 
                      onChange={v=>setEditRecord({...editRecord, Radlader:v})}
                      placeholder="Verbrauch Radlader in Litern"
                    />
                  </Item>
                  <Item label={<span><ToolOutlined style={{ marginRight: 8, color: "#3b7695" }} />7,5t Stapler (Liter)</span>}>
                    <InputNumber 
                      style={{ width: "100%" }} 
                      size="large"
                      value={editRecord.Stapler75t} 
                      onChange={v=>setEditRecord({...editRecord, Stapler75t:v})}
                      placeholder="Verbrauch 7,5t Stapler in Litern"
                    />
                  </Item>
                  <Item label={<span><ToolOutlined style={{ marginRight: 8, color: "#3b7695" }} />2,5t Stapler (Liter)</span>}>
                    <InputNumber 
                      style={{ width: "100%" }} 
                      size="large"
                      value={editRecord.Stapler25t} 
                      onChange={v=>setEditRecord({...editRecord, Stapler25t:v})}
                      placeholder="Verbrauch 2,5t Stapler in Litern"
                    />
                  </Item>
                </>
              )}
            </Form>
          </div>
        )}
      </Modal>

      {/* --- Modal ajout --- */}
      <Modal
        title={<span style={{ color: "#3b7695", fontWeight: 600, fontSize: "18px" }}><PlusCircleOutlined style={{ marginRight: 8 }} />Neue Monatswerte erfassen</span>}
        open={addModalVisible}
        onCancel={()=>{setAddModalVisible(false); form.resetFields();}}
        onOk={handleAddNew}
        okText="Daten speichern"
        cancelText="Abbrechen"
        width={600}
        okButtonProps={{ style:{ backgroundColor:'#3b7695', borderColor:'#3b7695', height: '40px' } }}
        cancelButtonProps={{ style: { height: '40px' } }}
      >
        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <Text style={{ color: '#52c41a', fontSize: '14px' }}>
            <CheckCircleTwoTone twoToneColor="#52c41a" style={{ marginRight: 8 }} />
            Erfassen Sie neue Monatswerte für die Diesel-Dokumentation - Alle Daten werden systematisch erfasst und für die Auswertung verfügbar gemacht.
          </Text>
        </Card>

        <Form form={form} layout="vertical">
          <Item label={<span><CalendarOutlined style={{ marginRight: 8, color: "#3b7695" }} />Jahr</span>} required>
            <InputNumber 
              style={{ width: "100%" }} 
              size="large"
              value={newRecord.Jahr} 
              onChange={v=>setNewRecord({...newRecord, Jahr:v})}
              placeholder="Geben Sie das Jahr ein (z.B. 2024)"
              min={2000}
              max={2100}
            />
          </Item>
          <Item label={<span><CalendarOutlined style={{ marginRight: 8, color: "#3b7695" }} />Monat</span>} required>
            <Select 
              style={{ width: "100%" }} 
              size="large"
              value={newRecord.Monat} 
              onChange={v=>setNewRecord({...newRecord, Monat:v})}
              placeholder="Wählen Sie den Monat aus"
            >
              {months.map(m=><Option key={m.num} value={m.num}>{m.name}</Option>)}
            </Select>
          </Item>
          
          {activeTab==="dieselbezug" ? (
            <>
              <Item label={<span><DashboardOutlined style={{ marginRight: 8, color: "#3b7695" }} />Diesel Lieferung (Liter)</span>}>
                <InputNumber 
                  style={{ width: "100%" }} 
                  size="large"
                  value={newRecord.DieselLieferung} 
                  onChange={v=>setNewRecord({...newRecord, DieselLieferung:v})}
                  placeholder="Gelieferte Dieselmenge in Litern"
                />
              </Item>
              <Item label={<span><ThunderboltOutlined style={{ marginRight: 8, color: "#3b7695" }} />Diesel Lieferung (kWh)</span>}>
                <InputNumber 
                  style={{ width: "100%" }} 
                  size="large"
                  value={newRecord.DieselLieferungKwh} 
                  onChange={v=>setNewRecord({...newRecord, DieselLieferungKwh:v})}
                  placeholder="Energiemenge in Kilowattstunden"
                />
              </Item>
              <Item label={<span><DollarOutlined style={{ marginRight: 8, color: "#3b7695" }} />Dieselkosten netto (€)</span>}>
                <InputNumber 
                  style={{ width: "100%" }} 
                  size="large"
                  value={newRecord.DieselkostenNetto} 
                  onChange={v=>setNewRecord({...newRecord, DieselkostenNetto:v})}
                  placeholder="Nettokosten in Euro"
                  step={0.01}
                />
              </Item>
            </>
          ) : (
            <>
              <Item label={<span><DashboardOutlined style={{ marginRight: 8, color: "#3b7695" }} />Dieselverbrauch Gesamt (Liter)</span>}>
                <InputNumber 
                  style={{ width: "100%" }} 
                  size="large"
                  value={newRecord.DieselverbrauchSumme} 
                  onChange={v=>setNewRecord({...newRecord, DieselverbrauchSumme:v})}
                  placeholder="Gesamter Dieselverbrauch in Litern"
                />
              </Item>
              <Item label={<span><ToolOutlined style={{ marginRight: 8, color: "#3b7695" }} />Bagger 904 (Liter)</span>}>
                <InputNumber 
                  style={{ width: "100%" }} 
                  size="large"
                  value={newRecord.Bagger904} 
                  onChange={v=>setNewRecord({...newRecord, Bagger904:v})}
                  placeholder="Verbrauch Bagger 904 in Litern"
                />
              </Item>
              <Item label={<span><ToolOutlined style={{ marginRight: 8, color: "#3b7695" }} />Bagger 316 (Liter)</span>}>
                <InputNumber 
                  style={{ width: "100%" }} 
                  size="large"
                  value={newRecord.Bagger316} 
                  onChange={v=>setNewRecord({...newRecord, Bagger316:v})}
                  placeholder="Verbrauch Bagger 316 in Litern"
                />
              </Item>
              <Item label={<span><ToolOutlined style={{ marginRight: 8, color: "#3b7695" }} />Radlader (Liter)</span>}>
                <InputNumber 
                  style={{ width: "100%" }} 
                  size="large"
                  value={newRecord.Radlader} 
                  onChange={v=>setNewRecord({...newRecord, Radlader:v})}
                  placeholder="Verbrauch Radlader in Litern"
                />
              </Item>
              <Item label={<span><ToolOutlined style={{ marginRight: 8, color: "#3b7695" }} />7,5t Stapler (Liter)</span>}>
                <InputNumber 
                  style={{ width: "100%" }} 
                  size="large"
                  value={newRecord.Stapler75t} 
                  onChange={v=>setNewRecord({...newRecord, Stapler75t:v})}
                  placeholder="Verbrauch 7,5t Stapler in Litern"
                />
              </Item>
              <Item label={<span><ToolOutlined style={{ marginRight: 8, color: "#3b7695" }} />2,5t Stapler (Liter)</span>}>
                <InputNumber 
                  style={{ width: "100%" }} 
                  size="large"
                  value={newRecord.Stapler25t} 
                  onChange={v=>setNewRecord({...newRecord, Stapler25t:v})}
                  placeholder="Verbrauch 2,5t Stapler in Litern"
                />
              </Item>
            </>
          )}
        </Form>
      </Modal>
    </Layout>
  );
}

export default App;