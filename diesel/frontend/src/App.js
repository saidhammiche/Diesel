import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Table, Layout, Typography, Select, Space, Button, Spin, Modal, InputNumber, message, notification, Tabs, Input, Form, Card, Row, Col, Statistic } from "antd";
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
  ThunderboltOutlined,
  FireOutlined,
  EuroCircleOutlined,
  RocketOutlined,
  CarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineChartOutlined
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

  // --- Totaux pour l'année sélectionnée et précédente ---
  const yearTotals = useMemo(() => {
    const currentYearData = allData.filter(item => item.Jahr === selectedYear);
    const previousYearData = allData.filter(item => item.Jahr === selectedYear - 1);
    
    const current = {
      dieselLieferung: currentYearData.reduce((sum, item) => sum + (item.DieselLieferung || 0), 0),
      dieselLieferungKwh: currentYearData.reduce((sum, item) => sum + (item.DieselLieferungKwh || 0), 0),
      dieselkostenNetto: currentYearData.reduce((sum, item) => sum + (item.DieselkostenNetto || 0), 0),
    };

    const previous = {
      dieselLieferung: previousYearData.reduce((sum, item) => sum + (item.DieselLieferung || 0), 0),
      dieselLieferungKwh: previousYearData.reduce((sum, item) => sum + (item.DieselLieferungKwh || 0), 0),
      dieselkostenNetto: previousYearData.reduce((sum, item) => sum + (item.DieselkostenNetto || 0), 0),
    };

    return { current, previous };
  }, [allData, selectedYear]);

  const verbrauchTotals = useMemo(() => {
    const currentYearData = verbrauchData.filter(item => item.Jahr === selectedYear);
    const previousYearData = verbrauchData.filter(item => item.Jahr === selectedYear - 1);
    
    const current = {
      dieselverbrauchSumme: currentYearData.reduce((sum, item) => sum + (item.DieselverbrauchSumme || 0), 0),
      bagger904: currentYearData.reduce((sum, item) => sum + (item.Bagger904 || 0), 0),
      bagger316: currentYearData.reduce((sum, item) => sum + (item.Bagger316 || 0), 0),
      radlader: currentYearData.reduce((sum, item) => sum + (item.Radlader || 0), 0),
      stapler75t: currentYearData.reduce((sum, item) => sum + (item.Stapler75t || 0), 0),
      stapler25t: currentYearData.reduce((sum, item) => sum + (item.Stapler25t || 0), 0),
    };

    const previous = {
      dieselverbrauchSumme: previousYearData.reduce((sum, item) => sum + (item.DieselverbrauchSumme || 0), 0),
      bagger904: previousYearData.reduce((sum, item) => sum + (item.Bagger904 || 0), 0),
      bagger316: previousYearData.reduce((sum, item) => sum + (item.Bagger316 || 0), 0),
      radlader: previousYearData.reduce((sum, item) => sum + (item.Radlader || 0), 0),
      stapler75t: previousYearData.reduce((sum, item) => sum + (item.Stapler75t || 0), 0),
      stapler25t: previousYearData.reduce((sum, item) => sum + (item.Stapler25t || 0), 0),
    };

    return { current, previous };
  }, [verbrauchData, selectedYear]);

  // --- Fonction pour calculer les variations ---
  const calculateVariation = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, percentage: 0, hasData: false };
    const value = current - previous;
    const percentage = ((value / previous) * 100);
    return { value, percentage, hasData: true };
  };

  // --- KPI Dashboard Data pour Dieselbezug ---
  const dieselbezugKpiData = useMemo(() => {
    const { current, previous } = yearTotals;
    
    const dieselCostPerLiter = current.dieselLieferung > 0 ? current.dieselkostenNetto / current.dieselLieferung : 0;
    const previousDieselCostPerLiter = previous.dieselLieferung > 0 ? previous.dieselkostenNetto / previous.dieselLieferung : 0;
    const costVariation = calculateVariation(dieselCostPerLiter, previousDieselCostPerLiter);

    const lieferungVariation = calculateVariation(current.dieselLieferung, previous.dieselLieferung);
    const kwhVariation = calculateVariation(current.dieselLieferungKwh, previous.dieselLieferungKwh);
    const kostenVariation = calculateVariation(current.dieselkostenNetto, previous.dieselkostenNetto);

    const monthlyAverage = current.dieselLieferung / 12;
    const previousMonthlyAverage = previous.dieselLieferung / 12;
    const monthlyVariation = calculateVariation(monthlyAverage, previousMonthlyAverage);

    return [
      {
        title: "Gesamtlieferung",
        value: current.dieselLieferung,
        suffix: "L",
        prefix: <FireOutlined />,
        color: "#1890ff",
        description: `Vergleich zu ${selectedYear - 1}`,
        variation: lieferungVariation,
        format: (val) => val.toLocaleString()
      },
      {
        title: "Energie geliefert",
        value: current.dieselLieferungKwh,
        suffix: "kWh",
        prefix: <ThunderboltOutlined />,
        color: "#13c2c2",
        description: `Vergleich zu ${selectedYear - 1}`,
        variation: kwhVariation,
        format: (val) => val.toLocaleString()
      },
      {
        title: "Gesamtkosten",
        value: current.dieselkostenNetto,
        suffix: "€",
        prefix: <EuroCircleOutlined />,
        color: "#52c41a",
        description: `Vergleich zu ${selectedYear - 1}`,
        variation: kostenVariation,
        format: (val) => val.toLocaleString('de-DE', {style:'currency', currency:'EUR'})
      },
      {
        title: "Durchschnittspreis",
        value: dieselCostPerLiter,
        suffix: "€/L",
        prefix: <DollarOutlined />,
        color: "#faad14",
        description: `Kosten pro Liter`,
        variation: costVariation,
        format: (val) => val.toFixed(3)
      },
      {
        title: "Monatlicher Schnitt",
        value: monthlyAverage,
        suffix: "L/Monat",
        prefix: <CalendarOutlined />,
        color: "#722ed1",
        description: `Durchschnitt pro Monat`,
        variation: monthlyVariation,
        format: (val) => val.toFixed(0)
      },
      {
        title: "Effizienz KPI",
        value: dieselCostPerLiter > 0 ? (current.dieselLieferungKwh / current.dieselkostenNetto) * 1000 : 0,
        suffix: "kWh/€",
        prefix: <LineChartOutlined />,
        color: "#eb2f96",
        description: "Energie pro 1000€",
        format: (val) => val.toFixed(1)
      }
    ];
  }, [yearTotals, selectedYear]);

  // --- KPI Dashboard Data pour Dieselverbrauch ---
  const dieselverbrauchKpiData = useMemo(() => {
    const { current, previous } = verbrauchTotals;

    const totalVariation = calculateVariation(current.dieselverbrauchSumme, previous.dieselverbrauchSumme);
    const bagger904Variation = calculateVariation(current.bagger904, previous.bagger904);
    const bagger316Variation = calculateVariation(current.bagger316, previous.bagger316);
    const radladerVariation = calculateVariation(current.radlader, previous.radlader);
    const stapler75tVariation = calculateVariation(current.stapler75t, previous.stapler75t);
    const stapler25tVariation = calculateVariation(current.stapler25t, previous.stapler25t);

    const monthlyAverage = current.dieselverbrauchSumme / 12;
    const previousMonthlyAverage = previous.dieselverbrauchSumme / 12;
    const monthlyVariation = calculateVariation(monthlyAverage, previousMonthlyAverage);

    const efficiencyRate = yearTotals.current.dieselLieferung > 0 ? 
      (current.dieselverbrauchSumme / yearTotals.current.dieselLieferung) * 100 : 0;

    return [
      {
        title: "Gesamtverbrauch",
        value: current.dieselverbrauchSumme,
        suffix: "L",
        prefix: <FireOutlined />,
        color: "#1890ff",
        description: `Vergleich zu ${selectedYear - 1}`,
        variation: totalVariation,
        format: (val) => val.toLocaleString()
      },
      {
        title: "Bagger 904",
        value: current.bagger904,
        suffix: "L",
        prefix: <ToolOutlined />,
        color: "#eb2f96",
        description: `Vergleich zu ${selectedYear - 1}`,
        variation: bagger904Variation,
        format: (val) => val.toLocaleString()
      },
      {
        title: "Bagger 316",
        value: current.bagger316,
        suffix: "L",
        prefix: <ToolOutlined />,
        color: "#fa8c16",
        description: `Vergleich zu ${selectedYear - 1}`,
        variation: bagger316Variation,
        format: (val) => val.toLocaleString()
      },
      {
        title: "Monatlicher Schnitt",
        value: monthlyAverage,
        suffix: "L/Monat",
        prefix: <CalendarOutlined />,
        color: "#722ed1",
        description: `Durchschnitt pro Monat`,
        variation: monthlyVariation,
        format: (val) => val.toFixed(0)
      },
      {
        title: "Radlader",
        value: current.radlader,
        suffix: "L",
        prefix: <CarOutlined />,
        color: "#52c41a",
        description: `Vergleich zu ${selectedYear - 1}`,
        variation: radladerVariation,
        format: (val) => val.toLocaleString()
      },
      {
        title: "Effizienzrate",
        value: efficiencyRate,
        suffix: "%",
        prefix: <BarChartOutlined />,
        color: "#13c2c2",
        description: "Verbrauch zu Lieferung",
        format: (val) => val.toFixed(1)
      }
    ];
  }, [verbrauchTotals, yearTotals, selectedYear]);

  // --- Fonction pour rendre la variation ---
  const renderVariation = (variation) => {
    if (!variation.hasData) {
      return <Text type="secondary" style={{ fontSize: '11px' }}>Keine Vergleichsdaten</Text>;
    }

    const isPositive = variation.percentage > 0;
    const arrow = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
    const color = isPositive ? '#cf1322' : '#3f8600';
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
        {arrow}
        <Text style={{ color, fontSize: '11px', marginLeft: 4 }}>
          {Math.abs(variation.percentage).toFixed(1)}% 
          <span style={{ marginLeft: 4, color: '#666' }}>
            ({isPositive ? '+' : ''}{variation.value > 0 ? variation.value.toLocaleString() : variation.value.toLocaleString()})
          </span>
        </Text>
      </div>
    );
  };

  const dieselTableData = useMemo(() => {
    const sorted = allData.filter(item => item.Jahr === selectedYear).sort((a,b)=>a.Monat-b.Monat);
    const sumRow = { 
      DieselbezugMonatID: 'sum', 
      Jahr: selectedYear, 
      Monat: 'Summe', 
      Monatname: 'Jahressumme', 
      DieselLieferung: yearTotals.current.dieselLieferung,
      DieselLieferungKwh: yearTotals.current.dieselLieferungKwh,
      DieselkostenNetto: yearTotals.current.dieselkostenNetto
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
      DieselverbrauchSumme: verbrauchTotals.current.dieselverbrauchSumme,
      Bagger904: verbrauchTotals.current.bagger904,
      Bagger316: verbrauchTotals.current.bagger316,
      Radlader: verbrauchTotals.current.radlader,
      Stapler75t: verbrauchTotals.current.stapler75t,
      Stapler25t: verbrauchTotals.current.stapler25t
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

  // --- Colonnes avec boutons Bearbeiten en couleur #3b7695 ---
  const dieselColumns = useMemo(() => [
    { title:"Jahr", dataIndex:"Jahr" },
    { title:"Monat", dataIndex:"Monat" },
    { title:"Monatname", dataIndex:"Monatname" },
    { title:"Diesel Lieferung (L)", dataIndex:"DieselLieferung", render:(text,record)=>record.DieselbezugMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"Diesel Lieferung (kWh)", dataIndex:"DieselLieferungKwh", render:(text,record)=>record.DieselbezugMonatID==='sum'?<Text strong>{(text||0).toLocaleString()}</Text>:(text||0).toLocaleString() },
    { title:"Dieselkosten (netto)", dataIndex:"DieselkostenNetto", render:(text,record)=>record.DieselbezugMonatID==='sum'?<Text strong>{(text||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'})}</Text>:(text||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'}) },
    { 
      title:"Aktion", 
      render:(_,record)=>record.DieselbezugMonatID==='sum'?null:
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={()=>setEditRecord({...record})}
          style={{ 
            backgroundColor: '#3b7695', 
            borderColor: '#3b7695',
            fontWeight: 500
          }}
        >
          Bearbeiten
        </Button> 
    }
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
    { 
      title:"Aktion", 
      render:(_,record)=>record.DieselverbrauchMonatID==='sum'?null:
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={()=>setEditRecord({...record})}
          style={{ 
            backgroundColor: '#3b7695', 
            borderColor: '#3b7695',
            fontWeight: 500
          }}
        >
          Bearbeiten
        </Button> 
    }
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

  // --- KPI data basé sur l'onglet actif ---
  const currentKpiData = activeTab === "dieselbezug" ? dieselbezugKpiData : dieselverbrauchKpiData;

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
        
        {/* --- DASHBOARD KPI SECTION --- */}
        <Card 
          style={{ 
            marginBottom: 24, 
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            border: "1px solid #d6e4ff",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={3} style={{ color: "#3b7695", margin: 0 }}>
              <RocketOutlined style={{ marginRight: 12, color: "#1890ff" }} />
              {activeTab === "dieselbezug" ? "Dieselbezug Performance" : "Dieselverbrauch Performance"} {selectedYear}
            </Title>
            <Text strong style={{ color: "#666" }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              Vergleich mit {selectedYear - 1}
            </Text>
          </div>

          <Row gutter={[16, 16]}>
            {currentKpiData.map((kpi, index) => (
              <Col xs={24} sm={12} md={8} lg={4} key={index}>
                <Card 
                  size="small" 
                  style={{ 
                    textAlign: 'center',
                    borderLeft: `4px solid ${kpi.color}`,
                    borderRadius: '8px',
                    background: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    height: '100%'
                  }}
                >
                  <Statistic
                    title={
                      <Text style={{ color: kpi.color, fontWeight: 600, fontSize: '12px' }}>
                        {React.cloneElement(kpi.prefix, { style: { marginRight: 8 } })}
                        {kpi.title}
                      </Text>
                    }
                    value={kpi.value}
                    suffix={kpi.suffix}
                    precision={kpi.precision || 0}
                    valueStyle={{ 
                      color: kpi.color, 
                      fontSize: '16px',
                      fontWeight: 700 
                    }}
                    formatter={value => kpi.format ? kpi.format(value) : value}
                  />
                  <Text type="secondary" style={{ fontSize: '10px', marginTop: '2px', display: 'block' }}>
                    {kpi.description}
                  </Text>
                  {kpi.variation && renderVariation(kpi.variation)}
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* --- Tabs avec ligne active en #3b7695 --- */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          type="line" 
          size="large" 
          style={{ marginBottom:24 }}
          tabBarStyle={{ borderBottom: '2px solid #f0f0f0' }}
          items={[
            {
              key: "dieselbezug",
              label: (
                <span>
                  <DashboardOutlined style={{ marginRight: 8, color: activeTab === "dieselbezug" ? "#3b7695" : "#666" }} />
                  <span style={{ color: activeTab === "dieselbezug" ? "#3b7695" : "#666", fontWeight: activeTab === "dieselbezug" ? 600 : 400 }}>
                    Dieselbezug
                  </span>
                </span>
              ),
              children: (
                <>
                  <Space style={{ marginBottom:16 }}>
                    <Button 
                      type="primary" 
                      icon={<PlusCircleOutlined />} 
                      onClick={()=>setAddModalVisible(true)} 
                      style={{ 
                        backgroundColor: "#3b7695", 
                        borderColor: "#3b7695", 
                        height: "40px", 
                        fontWeight: 600 
                      }}
                    >
                      Neue Monatswerte erfassen
                    </Button>
                  </Space>
                  <Spin spinning={loading || saving || yearLoading} tip={<span style={{ color:"#3b7695", fontWeight:600 }}>Laden / Speichern...</span>} size="large">
                    <div style={{ border:"2px solid #3b7695", borderRadius:"6px", overflow:"hidden", boxShadow:"0 2px 6px rgba(0,0,0,0.05)" }}>
                      <Table 
                        columns={dieselColumns} 
                        dataSource={dieselTableData} 
                        rowKey="DieselbezugMonatID" 
                        bordered 
                        pagination={false} 
                        rowClassName={r=>r.DieselbezugMonatID==='sum'?'sum-row':''} 
                        scroll={{x:true}} 
                      />
                    </div>
                  </Spin>
                </>
              )
            },
            {
              key: "dieselverbrauch",
              label: (
                <span>
                  <BarChartOutlined style={{ marginRight: 8, color: activeTab === "dieselverbrauch" ? "#3b7695" : "#666" }} />
                  <span style={{ color: activeTab === "dieselverbrauch" ? "#3b7695" : "#666", fontWeight: activeTab === "dieselverbrauch" ? 600 : 400 }}>
                    Dieselverbrauch
                  </span>
                </span>
              ),
              children: (
                <>
                  <Space style={{ marginBottom:16 }}>
                    <Button 
                      type="primary" 
                      icon={<PlusCircleOutlined />} 
                      onClick={()=>setAddModalVisible(true)} 
                      style={{ 
                        backgroundColor: "#3b7695", 
                        borderColor: "#3b7695", 
                        height: "40px", 
                        fontWeight: 600 
                      }}
                    >
                      Neue Monatswerte erfassen
                    </Button>
                  </Space>
                  <Spin spinning={loading || saving || yearLoading} tip={<span style={{ color:"#3b7695", fontWeight:600 }}>Laden / Speichern...</span>} size="large">
                    <div style={{ border:"2px solid #3b7695", borderRadius:"6px", overflow:"hidden", boxShadow:"0 2px 6px rgba(0,0,0,0.05)" }}>
                      <Table 
                        columns={verbrauchColumns} 
                        dataSource={verbrauchTableData} 
                        rowKey="DieselverbrauchMonatID" 
                        bordered 
                        pagination={false} 
                        rowClassName={r=>r.DieselverbrauchMonatID==='sum'?'sum-row':''} 
                        scroll={{x:true}} 
                      />
                    </div>
                  </Spin>
                </>
              )
            }
          ]}
        />
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