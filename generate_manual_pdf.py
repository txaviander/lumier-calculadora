#!/usr/bin/env python3
"""
Generador de PDF del Manual de Cálculos - Lumier Casas Boutique
Diseño profesional con gráficos y colores
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, Flowable, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import io

# Colores corporativos Lumier
LUMIER_GOLD = HexColor('#d4af37')
LUMIER_GOLD_LIGHT = HexColor('#f4e4bc')
LUMIER_BLACK = HexColor('#1a1a1a')
LUMIER_GRAY = HexColor('#666666')
LUMIER_LIGHT_GRAY = HexColor('#f5f5f5')
LUMIER_GREEN = HexColor('#22c55e')
LUMIER_YELLOW = HexColor('#eab308')
LUMIER_RED = HexColor('#ef4444')
LUMIER_BLUE = HexColor('#3b82f6')

# Tamaño de página
width, height = A4

class ColoredBox(Flowable):
    """Caja de color con texto"""
    def __init__(self, text, bg_color, text_color=white, width=None, height=30, font_size=12):
        Flowable.__init__(self)
        self.text = text
        self.bg_color = bg_color
        self.text_color = text_color
        self.box_width = width or (A4[0] - 40*mm)
        self.box_height = height
        self.font_size = font_size

    def draw(self):
        self.canv.setFillColor(self.bg_color)
        self.canv.roundRect(0, 0, self.box_width, self.box_height, 5, fill=1, stroke=0)
        self.canv.setFillColor(self.text_color)
        self.canv.setFont("Helvetica-Bold", self.font_size)
        self.canv.drawCentredString(self.box_width/2, self.box_height/2 - 4, self.text)

    def wrap(self, availWidth, availHeight):
        return (self.box_width, self.box_height)

class InfoCard(Flowable):
    """Tarjeta de información con icono"""
    def __init__(self, title, value, subtitle="", color=LUMIER_GOLD, width=120, height=80):
        Flowable.__init__(self)
        self.title = title
        self.value = value
        self.subtitle = subtitle
        self.color = color
        self.card_width = width
        self.card_height = height

    def draw(self):
        # Fondo
        self.canv.setFillColor(LUMIER_LIGHT_GRAY)
        self.canv.roundRect(0, 0, self.card_width, self.card_height, 8, fill=1, stroke=0)

        # Barra superior de color
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, self.card_height-8, self.card_width, 8, 0, fill=1, stroke=0)

        # Título
        self.canv.setFillColor(LUMIER_GRAY)
        self.canv.setFont("Helvetica", 9)
        self.canv.drawString(10, self.card_height - 25, self.title)

        # Valor
        self.canv.setFillColor(LUMIER_BLACK)
        self.canv.setFont("Helvetica-Bold", 18)
        self.canv.drawString(10, self.card_height - 50, self.value)

        # Subtítulo
        if self.subtitle:
            self.canv.setFillColor(self.color)
            self.canv.setFont("Helvetica", 8)
            self.canv.drawString(10, 10, self.subtitle)

    def wrap(self, availWidth, availHeight):
        return (self.card_width, self.card_height)

class FormulaBox(Flowable):
    """Caja para mostrar fórmulas"""
    def __init__(self, formula, description="", width=None):
        Flowable.__init__(self)
        self.formula = formula
        self.description = description
        self.box_width = width or (A4[0] - 50*mm)
        self.box_height = 50 if description else 35

    def draw(self):
        # Fondo
        self.canv.setFillColor(HexColor('#fefce8'))  # Amarillo muy claro
        self.canv.setStrokeColor(LUMIER_GOLD)
        self.canv.setLineWidth(2)
        self.canv.roundRect(0, 0, self.box_width, self.box_height, 5, fill=1, stroke=1)

        # Fórmula
        self.canv.setFillColor(LUMIER_BLACK)
        self.canv.setFont("Courier-Bold", 11)
        y_pos = self.box_height - 20 if self.description else self.box_height/2 - 4
        self.canv.drawCentredString(self.box_width/2, y_pos, self.formula)

        # Descripción
        if self.description:
            self.canv.setFillColor(LUMIER_GRAY)
            self.canv.setFont("Helvetica-Oblique", 9)
            self.canv.drawCentredString(self.box_width/2, 10, self.description)

    def wrap(self, availWidth, availHeight):
        return (self.box_width, self.box_height)

class MarginIndicator(Flowable):
    """Indicador visual de margen con semáforo"""
    def __init__(self, width=None):
        Flowable.__init__(self)
        self.box_width = width or (A4[0] - 50*mm)
        self.box_height = 100

    def draw(self):
        # Título
        self.canv.setFillColor(LUMIER_BLACK)
        self.canv.setFont("Helvetica-Bold", 12)
        self.canv.drawString(10, self.box_height - 15, "Clasificación de Proyectos por Margen")

        # Indicadores
        indicators = [
            (LUMIER_GREEN, "≥ 16%", "OPORTUNIDAD", "Proceder"),
            (LUMIER_YELLOW, "13-16%", "AJUSTADO", "Revisar"),
            (LUMIER_RED, "< 13%", "NO HACER", "Descartar"),
        ]

        x = 10
        for color, range_text, label, action in indicators:
            # Círculo de color
            self.canv.setFillColor(color)
            self.canv.circle(x + 15, self.box_height - 45, 12, fill=1, stroke=0)

            # Rango
            self.canv.setFillColor(LUMIER_BLACK)
            self.canv.setFont("Helvetica-Bold", 11)
            self.canv.drawString(x + 35, self.box_height - 40, range_text)

            # Label
            self.canv.setFont("Helvetica-Bold", 10)
            self.canv.drawString(x + 35, self.box_height - 55, label)

            # Acción
            self.canv.setFillColor(LUMIER_GRAY)
            self.canv.setFont("Helvetica", 9)
            self.canv.drawString(x + 35, self.box_height - 68, action)

            x += 150

    def wrap(self, availWidth, availHeight):
        return (self.box_width, self.box_height)

def create_cost_bar_chart():
    """Crea gráfico de barras de costes por calidad"""
    drawing = Drawing(450, 200)

    # Datos
    data = [
        (350, 420, 560, 700, 900),  # Obra
        (300, 400, 512, 650, 850),  # Materiales
    ]

    bc = VerticalBarChart()
    bc.x = 50
    bc.y = 30
    bc.height = 140
    bc.width = 380
    bc.data = data
    bc.strokeColor = None
    bc.categoryAxis.categoryNames = ['1★', '2★', '3★', '4★', '5★']
    bc.categoryAxis.labels.fontName = 'Helvetica'
    bc.categoryAxis.labels.fontSize = 10
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = 1000
    bc.valueAxis.valueStep = 200
    bc.bars[0].fillColor = LUMIER_GOLD
    bc.bars[1].fillColor = LUMIER_BLUE

    # Leyenda manual
    drawing.add(bc)

    # Leyenda
    drawing.add(Rect(60, 180, 15, 10, fillColor=LUMIER_GOLD, strokeColor=None))
    drawing.add(String(80, 182, "Obra (€/m²)", fontName='Helvetica', fontSize=9))
    drawing.add(Rect(180, 180, 15, 10, fillColor=LUMIER_BLUE, strokeColor=None))
    drawing.add(String(200, 182, "Materiales (€/m²)", fontName='Helvetica', fontSize=9))

    return drawing

def create_investment_pie():
    """Crea gráfico de tarta de distribución de inversión"""
    drawing = Drawing(300, 180)

    pc = Pie()
    pc.x = 80
    pc.y = 20
    pc.width = 120
    pc.height = 120
    pc.data = [82.6, 14.8, 1.4, 1.2]  # Porcentajes aproximados
    pc.labels = ['Adquisición', 'Hard Costs', 'Soft Costs', 'Intereses']
    pc.slices.strokeWidth = 0.5
    pc.slices[0].fillColor = LUMIER_GOLD
    pc.slices[1].fillColor = LUMIER_BLUE
    pc.slices[2].fillColor = LUMIER_GREEN
    pc.slices[3].fillColor = LUMIER_RED
    pc.slices.fontName = 'Helvetica'
    pc.slices.fontSize = 8

    drawing.add(pc)
    return drawing

def header_footer(canvas, doc):
    """Encabezado y pie de página"""
    canvas.saveState()

    # Encabezado
    canvas.setFillColor(LUMIER_BLACK)
    canvas.rect(0, height - 25*mm, width, 25*mm, fill=1, stroke=0)

    canvas.setFillColor(LUMIER_GOLD)
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawString(20*mm, height - 17*mm, "LUMIER CASAS BOUTIQUE")

    canvas.setFillColor(white)
    canvas.setFont("Helvetica", 10)
    canvas.drawRightString(width - 20*mm, height - 17*mm, "Manual Técnico de Cálculos")

    # Línea dorada
    canvas.setStrokeColor(LUMIER_GOLD)
    canvas.setLineWidth(3)
    canvas.line(0, height - 25*mm, width, height - 25*mm)

    # Pie de página
    canvas.setFillColor(LUMIER_LIGHT_GRAY)
    canvas.rect(0, 0, width, 15*mm, fill=1, stroke=0)

    canvas.setFillColor(LUMIER_GRAY)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(20*mm, 6*mm, "Documento confidencial - Uso interno")
    canvas.drawRightString(width - 20*mm, 6*mm, f"Página {doc.page}")

    canvas.restoreState()

def first_page(canvas, doc):
    """Primera página - Portada"""
    canvas.saveState()

    # Fondo negro completo para la parte superior (60% de la página)
    canvas.setFillColor(LUMIER_BLACK)
    canvas.rect(0, height * 0.40, width, height * 0.60, fill=1, stroke=0)

    # === LOGO LUMIER (estilo oficial) ===
    # Texto principal "LUMIER" en dorado
    canvas.setFillColor(LUMIER_GOLD)
    canvas.setFont("Helvetica-Bold", 48)
    canvas.drawCentredString(width/2, height - 70*mm, "LUMIER")

    # Subtítulo "CASAS BOUTIQUE" en blanco, espaciado
    canvas.setFillColor(white)
    canvas.setFont("Helvetica", 16)
    # Añadir espaciado entre letras manualmente
    spaced_text = "C A S A S   B O U T I Q U E"
    canvas.drawCentredString(width/2, height - 85*mm, spaced_text)

    # Línea decorativa dorada debajo del logo
    canvas.setStrokeColor(LUMIER_GOLD)
    canvas.setLineWidth(1.5)
    canvas.line(width/2 - 70*mm, height - 100*mm, width/2 + 70*mm, height - 100*mm)

    # === TÍTULO DEL DOCUMENTO ===
    canvas.setFillColor(LUMIER_GOLD)
    canvas.setFont("Helvetica-Bold", 28)
    canvas.drawCentredString(width/2, height - 130*mm, "Manual Técnico de Cálculos")

    canvas.setFillColor(HexColor('#999999'))
    canvas.setFont("Helvetica", 13)
    canvas.drawCentredString(width/2, height - 145*mm, "Calculadora de Renovaciones Inmobiliarias")

    # === SECCIÓN INFERIOR (fondo beige/crema) ===
    canvas.setFillColor(HexColor('#f5f0e6'))  # Beige más suave
    canvas.rect(0, 0, width, height * 0.40, fill=1, stroke=0)

    # Línea dorada de separación
    canvas.setStrokeColor(LUMIER_GOLD)
    canvas.setLineWidth(3)
    canvas.line(0, height * 0.40, width, height * 0.40)

    # Texto "Documento para Revisión..."
    canvas.setFillColor(LUMIER_BLACK)
    canvas.setFont("Helvetica-Bold", 16)
    canvas.drawCentredString(width/2, height * 0.40 - 25*mm, "Documento para Revisión del Equipo Financiero")

    # Versión
    canvas.setFillColor(LUMIER_GRAY)
    canvas.setFont("Helvetica", 12)
    canvas.drawCentredString(width/2, height * 0.40 - 38*mm, "Versión 2.0  |  Enero 2026")

    # === CAJA BLANCA CON CONTENIDO ===
    box_width = width - 50*mm
    box_height = 75*mm
    box_x = 25*mm
    box_y = 20*mm

    # Sombra sutil
    canvas.setFillColor(HexColor('#e0e0e0'))
    canvas.roundRect(box_x + 2*mm, box_y - 2*mm, box_width, box_height, 8, fill=1, stroke=0)

    # Caja blanca
    canvas.setFillColor(white)
    canvas.roundRect(box_x, box_y, box_width, box_height, 8, fill=1, stroke=0)

    # Contenido de la caja
    canvas.setFillColor(LUMIER_BLACK)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(box_x + 15*mm, box_y + box_height - 18*mm, "Este documento incluye:")

    items = [
        ("✓", "Todas las fórmulas de cálculo documentadas"),
        ("✓", "Constantes y parámetros configurables"),
        ("✓", "Ejemplos paso a paso"),
        ("✓", "Áreas de mejora identificadas"),
        ("✓", "Recomendaciones para el equipo financiero")
    ]

    y = box_y + box_height - 32*mm
    for check, text in items:
        canvas.setFillColor(LUMIER_GREEN)
        canvas.setFont("Helvetica-Bold", 11)
        canvas.drawString(box_x + 15*mm, y, check)
        canvas.setFillColor(LUMIER_BLACK)
        canvas.setFont("Helvetica", 10)
        canvas.drawString(box_x + 25*mm, y, text)
        y -= 11*mm

    canvas.restoreState()

def build_pdf():
    """Construye el PDF completo"""
    doc = SimpleDocTemplate(
        "MANUAL_CALCULOS_VISUAL.pdf",
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=35*mm,
        bottomMargin=25*mm
    )

    # Estilos
    styles = getSampleStyleSheet()

    # Estilos personalizados
    styles.add(ParagraphStyle(
        name='LumierTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=LUMIER_BLACK,
        spaceAfter=20,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='LumierHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=LUMIER_GOLD,
        spaceAfter=12,
        spaceBefore=15,
        fontName='Helvetica-Bold',
        borderColor=LUMIER_GOLD,
        borderWidth=0,
        borderPadding=5
    ))

    styles.add(ParagraphStyle(
        name='LumierHeading3',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=LUMIER_BLACK,
        spaceAfter=8,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='LumierBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=LUMIER_BLACK,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        fontName='Helvetica'
    ))

    styles.add(ParagraphStyle(
        name='LumierNote',
        parent=styles['Normal'],
        fontSize=9,
        textColor=LUMIER_GRAY,
        spaceAfter=6,
        leftIndent=20,
        fontName='Helvetica-Oblique'
    ))

    story = []

    # ============= PÁGINA 2: ÍNDICE =============
    story.append(PageBreak())
    story.append(Paragraph("Índice de Contenidos", styles['LumierTitle']))
    story.append(Spacer(1, 10*mm))

    toc_data = [
        ["1.", "Resumen Ejecutivo", "Fórmulas clave y clasificación"],
        ["2.", "Flujo de Cálculo", "Diagrama visual del proceso"],
        ["3.", "Cálculos de Adquisición", "ITP, honorarios, escrituras"],
        ["4.", "Hard Costs (Reforma)", "Obra, materiales, interiorismo"],
        ["5.", "Soft Costs", "Arquitectura, permisos, tenencia"],
        ["6.", "Cálculos de Venta", "Honorarios y venta neta"],
        ["7.", "Financiación", "Intereses y equity"],
        ["8.", "Métricas de Rentabilidad", "ROI, Margen, TIR"],
        ["9.", "Tablas de Referencia", "Costes por nivel de calidad"],
        ["10.", "Áreas de Mejora", "Propuestas de optimización"],
    ]

    toc_table = Table(toc_data, colWidths=[15*mm, 55*mm, 80*mm])
    toc_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), LUMIER_GOLD),
        ('TEXTCOLOR', (1, 0), (1, -1), LUMIER_BLACK),
        ('TEXTCOLOR', (2, 0), (2, -1), LUMIER_GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, LUMIER_LIGHT_GRAY),
    ]))
    story.append(toc_table)

    # ============= PÁGINA 3: RESUMEN EJECUTIVO =============
    story.append(PageBreak())
    story.append(ColoredBox("1. RESUMEN EJECUTIVO", LUMIER_BLACK, LUMIER_GOLD, height=35, font_size=14))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph(
        "La calculadora determina la rentabilidad de proyectos de renovación inmobiliaria "
        "mediante el análisis de todos los costes asociados y la proyección de beneficios.",
        styles['LumierBody']
    ))
    story.append(Spacer(1, 5*mm))

    # Fórmula principal
    story.append(Paragraph("Fórmula Principal", styles['LumierHeading2']))
    story.append(FormulaBox(
        "BENEFICIO NETO = Venta Neta - Inversión Total",
        "Donde: Inversión Total = Adquisición + Gastos Reforma + Intereses"
    ))
    story.append(Spacer(1, 8*mm))

    # Indicadores clave
    story.append(Paragraph("Indicadores Clave de Decisión", styles['LumierHeading2']))

    kpi_data = [
        ["Indicador", "Fórmula", "Umbral Recomendado"],
        ["Margen", "Beneficio / Precio Venta × 100", "≥ 16%"],
        ["ROI", "Beneficio / Inversión Total × 100", "≥ 20%"],
        ["TIR Anual", "((Venta/Inversión)^(12/meses)) - 1", "≥ 30%"],
    ]

    kpi_table = Table(kpi_data, colWidths=[40*mm, 70*mm, 50*mm])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_BLACK),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('BACKGROUND', (0, 1), (-1, -1), white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LUMIER_LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 8*mm))

    # Clasificación de proyectos
    story.append(Paragraph("Sistema de Clasificación", styles['LumierHeading2']))
    story.append(MarginIndicator())

    # ============= PÁGINA 4: FLUJO DE CÁLCULO =============
    story.append(PageBreak())
    story.append(ColoredBox("2. FLUJO DE CÁLCULO", LUMIER_BLACK, LUMIER_GOLD, height=35, font_size=14))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph(
        "El siguiente diagrama muestra el flujo completo del cálculo de rentabilidad:",
        styles['LumierBody']
    ))
    story.append(Spacer(1, 5*mm))

    # Diagrama de flujo simplificado con tabla
    flow_data = [
        ["ENTRADA", "→", "PROCESO", "→", "SALIDA"],
        ["Precio Compra\nM² Construidos\nCalidad (1-5★)\nPrecio Venta\nFinanciación", "",
         "1. Calcular Adquisición\n2. Calcular Hard Costs\n3. Calcular Soft Costs\n4. Calcular Venta Neta\n5. Calcular Intereses", "",
         "Inversión Total\nBeneficio Neto\nROI\nMargen\nTIR"],
    ]

    flow_table = Table(flow_data, colWidths=[45*mm, 10*mm, 50*mm, 10*mm, 45*mm])
    flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), LUMIER_BLUE),
        ('BACKGROUND', (2, 0), (2, 0), LUMIER_GOLD),
        ('BACKGROUND', (4, 0), (4, 0), LUMIER_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BACKGROUND', (0, 1), (0, 1), HexColor('#dbeafe')),
        ('BACKGROUND', (2, 1), (2, 1), LUMIER_GOLD_LIGHT),
        ('BACKGROUND', (4, 1), (4, 1), HexColor('#dcfce7')),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (1, 0), (3, -1), 14),
        ('TEXTCOLOR', (1, 0), (1, -1), LUMIER_GRAY),
        ('TEXTCOLOR', (3, 0), (3, -1), LUMIER_GRAY),
    ]))
    story.append(flow_table)
    story.append(Spacer(1, 10*mm))

    # Desglose de inversión
    story.append(Paragraph("Composición Típica de la Inversión", styles['LumierHeading2']))

    inv_data = [
        ["Componente", "% Típico", "Descripción"],
        ["Adquisición", "82-85%", "Precio + ITP + Escrituras + Honorarios"],
        ["Hard Costs", "12-15%", "Obra + Materiales + Interiorismo + Mobiliario"],
        ["Soft Costs", "1-2%", "Arquitectura + Permisos + Tenencia + Plusvalía"],
        ["Intereses", "1-2%", "Coste financiero del préstamo"],
    ]

    inv_table = Table(inv_data, colWidths=[40*mm, 25*mm, 95*mm])
    inv_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_BLACK),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LUMIER_LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(inv_table)

    # ============= PÁGINA 5: CÁLCULOS DE ADQUISICIÓN =============
    story.append(PageBreak())
    story.append(ColoredBox("3. CÁLCULOS DE ADQUISICIÓN", LUMIER_BLACK, LUMIER_GOLD, height=35, font_size=14))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("3.1 Honorarios de Compra (con intermediación)", styles['LumierHeading3']))
    story.append(FormulaBox("Honorario = Precio Compra × (% Comisión / 100) × 1.21"))
    story.append(Paragraph("⚠️ El factor 1.21 corresponde al IVA (21%)", styles['LumierNote']))
    story.append(Spacer(1, 5*mm))

    story.append(Paragraph("3.2 Impuesto de Transmisiones Patrimoniales", styles['LumierHeading3']))
    story.append(FormulaBox("ITP = Precio Compra × 0.02 (2%)", "⚠️ ÁREA DE MEJORA: Debería variar por Comunidad Autónoma"))
    story.append(Spacer(1, 5*mm))

    story.append(Paragraph("3.3 Otros Gastos Fijos", styles['LumierHeading3']))

    fixed_costs = [
        ["Concepto", "Valor Actual", "Notas"],
        ["Inscripción Escritura", "1.530 €", "Valor fijo"],
    ]

    fixed_table = Table(fixed_costs, colWidths=[50*mm, 40*mm, 70*mm])
    fixed_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_BLACK),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(fixed_table)
    story.append(Spacer(1, 5*mm))

    story.append(Paragraph("3.4 Total Adquisición", styles['LumierHeading3']))
    story.append(FormulaBox("Total Adquisición = Precio + Honorarios + Inscripción + ITP"))

    # Ejemplo práctico
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("📋 Ejemplo Práctico", styles['LumierHeading2']))

    example_data = [
        ["Concepto", "Cálculo", "Resultado"],
        ["Precio Compra", "-", "1.065.000 €"],
        ["Honorarios (sin interm.)", "0", "0 €"],
        ["Inscripción", "Fijo", "1.530 €"],
        ["ITP (2%)", "1.065.000 × 0.02", "21.300 €"],
        ["TOTAL ADQUISICIÓN", "", "1.087.830 €"],
    ]

    example_table = Table(example_data, colWidths=[50*mm, 50*mm, 50*mm])
    example_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_BLACK),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_GOLD),
        ('BACKGROUND', (0, -1), (-1, -1), LUMIER_GOLD_LIGHT),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(example_table)

    # ============= PÁGINA 6: HARD COSTS =============
    story.append(PageBreak())
    story.append(ColoredBox("4. HARD COSTS (REFORMA)", LUMIER_BLACK, LUMIER_GOLD, height=35, font_size=14))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph(
        "Los costes de reforma varían según el nivel de calidad seleccionado (1★ a 5★). "
        "A mayor calidad, mayor coste pero también mayor valor de venta potencial.",
        styles['LumierBody']
    ))
    story.append(Spacer(1, 5*mm))

    # Tabla de costes por calidad
    story.append(Paragraph("Tabla de Costes por Nivel de Calidad (€/m²)", styles['LumierHeading2']))

    quality_data = [
        ["Concepto", "1★", "2★", "3★", "4★", "5★"],
        ["Obra", "350", "420", "560", "700", "900"],
        ["Materiales", "300", "400", "512", "650", "850"],
        ["Interiorismo", "40", "50", "59", "75", "95"],
        ["Mobiliario", "60", "80", "102", "130", "170"],
        ["Arquitectura", "25", "32", "38", "48", "60"],
        ["TOTAL €/m²", "775", "982", "1.271", "1.603", "2.075"],
    ]

    quality_table = Table(quality_data, colWidths=[40*mm, 22*mm, 22*mm, 22*mm, 22*mm, 22*mm])
    quality_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_BLACK),
        ('BACKGROUND', (0, 0), (0, -1), LUMIER_BLACK),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_GOLD),
        ('TEXTCOLOR', (0, 0), (0, -1), LUMIER_GOLD),
        ('BACKGROUND', (0, -1), (-1, -1), LUMIER_GOLD_LIGHT),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(quality_table)
    story.append(Spacer(1, 8*mm))

    # Costes adicionales
    story.append(Paragraph("Costes Adicionales", styles['LumierHeading2']))

    additional_data = [
        ["Concepto", "Valor", "Condición"],
        ["Terraza", "36,50 €/m²", "Si terrazaM2 > 0"],
        ["Toldo/Pérgola", "2.500 €", "Si toldoPergola = true"],
        ["Suplemento Clásico", "790 €", "Si esClasico = true"],
        ["Extras", "Variable", "Valor manual"],
    ]

    add_table = Table(additional_data, colWidths=[50*mm, 40*mm, 60*mm])
    add_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_BLACK),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(add_table)
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("Fórmula de Hard Costs", styles['LumierHeading3']))
    story.append(FormulaBox("Hard Costs = Obra + Materiales + Interiorismo + Mobiliario + Terraza + Toldo + Extras"))

    # ============= PÁGINA 7: SOFT COSTS =============
    story.append(PageBreak())
    story.append(ColoredBox("5. SOFT COSTS", LUMIER_BLACK, LUMIER_GOLD, height=35, font_size=14))
    story.append(Spacer(1, 8*mm))

    soft_data = [
        ["Concepto", "Fórmula/Valor", "Notas"],
        ["Arquitectura", "m² × (25-60 €/m²)", "Según calidad"],
        ["Permiso Construcción", "m² × 34,20 €/m²", "Fijo por m²"],
        ["Gastos Venta", "800 €", "Valor fijo"],
        ["Costos Tenencia", "2.490 €", "⚠️ Debería ser dinámico"],
        ["Plusvalía", "Precio Venta × 0,27%", "⚠️ Simplificación"],
    ]

    soft_table = Table(soft_data, colWidths=[45*mm, 50*mm, 55*mm])
    soft_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_BLACK),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LUMIER_LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(soft_table)
    story.append(Spacer(1, 8*mm))

    story.append(FormulaBox("Soft Costs = Arquitectura + Permisos + Gastos Venta + Tenencia + Plusvalía"))

    # ============= CÁLCULOS DE VENTA =============
    story.append(Spacer(1, 10*mm))
    story.append(ColoredBox("6. CÁLCULOS DE VENTA", LUMIER_BLACK, LUMIER_GOLD, height=35, font_size=14))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("6.1 Honorarios de Venta (con intermediación)", styles['LumierHeading3']))
    story.append(FormulaBox("Honorarios Venta = Precio Venta × (% Comisión / 100) × 1.21"))
    story.append(Spacer(1, 5*mm))

    story.append(Paragraph("6.2 Venta Neta", styles['LumierHeading3']))
    story.append(FormulaBox("Venta Neta = Precio Venta - Honorarios Venta"))

    # ============= PÁGINA 8: FINANCIACIÓN Y MÉTRICAS =============
    story.append(PageBreak())
    story.append(ColoredBox("7. FINANCIACIÓN", LUMIER_BLACK, LUMIER_GOLD, height=35, font_size=14))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("7.1 Interés del Proyecto", styles['LumierHeading3']))
    story.append(FormulaBox("Interés = Deuda × (Tasa Anual / 100) / 2", "Se asume uso promedio del 50% del tiempo"))
    story.append(Paragraph(
        "⚠️ ÁREA DE MEJORA: El cálculo actual no considera comisiones de apertura, "
        "cancelación anticipada, ni el calendario real de disposición del préstamo.",
        styles['LumierNote']
    ))
    story.append(Spacer(1, 5*mm))

    story.append(Paragraph("7.2 Equity Necesario", styles['LumierHeading3']))
    story.append(FormulaBox("Equity = Total Adquisición + Total Gastos - Deuda"))

    # Métricas
    story.append(Spacer(1, 10*mm))
    story.append(ColoredBox("8. MÉTRICAS DE RENTABILIDAD", LUMIER_BLACK, LUMIER_GOLD, height=35, font_size=14))
    story.append(Spacer(1, 8*mm))

    metrics_data = [
        ["Métrica", "Fórmula", "Interpretación"],
        ["Inversión Total", "Adquisición + Gastos + Intereses", "Capital total comprometido"],
        ["Beneficio Neto", "Venta Neta - Inversión Total", "Ganancia absoluta"],
        ["ROI", "(Beneficio / Inversión) × 100", "Retorno sobre inversión"],
        ["Margen", "(Beneficio / Precio Venta) × 100", "% sobre precio de venta"],
        ["TIR", "((Venta/Inv)^(12/meses)) - 1", "Rentabilidad anualizada"],
    ]

    metrics_table = Table(metrics_data, colWidths=[35*mm, 60*mm, 55*mm])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_BLACK),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (1, 1), (1, -1), 'Courier'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LUMIER_LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(metrics_table)

    # ============= PÁGINA 9: ÁREAS DE MEJORA =============
    story.append(PageBreak())
    story.append(ColoredBox("10. ÁREAS DE MEJORA IDENTIFICADAS", LUMIER_BLACK, LUMIER_GOLD, height=35, font_size=14))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("Prioridad Alta 🔴", styles['LumierHeading2']))

    high_priority = [
        ["#", "Área", "Problema", "Propuesta"],
        ["1", "ITP", "Fijo 2% (incorrecto)", "Tabla por CCAA (Madrid 6%, Cat. 10%...)"],
        ["2", "Plusvalía", "% fijo sobre venta", "Cálculo real: valor catastral × coef. × tipo"],
        ["3", "Tenencia", "Fijo 2.490€", "Dinámico según duración proyecto"],
    ]

    hp_table = Table(high_priority, colWidths=[10*mm, 30*mm, 50*mm, 60*mm])
    hp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_RED),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(hp_table)
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("Prioridad Media 🟡", styles['LumierHeading2']))

    med_priority = [
        ["#", "Área", "Problema", "Propuesta"],
        ["4", "Escrituras", "Fijo 1.530€", "Escalar según aranceles"],
        ["5", "Gastos Venta", "Fijo 800€", "Desglosar: certificado, cédula, fotos..."],
        ["6", "Intereses", "Simplificado", "Considerar apertura, cancelación, fechas"],
    ]

    mp_table = Table(med_priority, colWidths=[10*mm, 30*mm, 50*mm, 60*mm])
    mp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_YELLOW),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_BLACK),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(mp_table)
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("Prioridad Baja 🟢 (Futuras)", styles['LumierHeading2']))

    low_priority = [
        ["7. Inflación de costes durante el proyecto"],
        ["8. Escenarios de mercado (optimista/base/pesimista)"],
        ["9. Coste de oportunidad del capital propio"],
        ["10. Impuestos sobre beneficios (IRPF/IS)"],
    ]

    lp_table = Table(low_priority, colWidths=[150*mm])
    lp_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(lp_table)

    # ============= PÁGINA 10: EJEMPLO COMPLETO =============
    story.append(PageBreak())
    story.append(ColoredBox("EJEMPLO COMPLETO DE CÁLCULO", LUMIER_GOLD, LUMIER_BLACK, height=35, font_size=14))
    story.append(Spacer(1, 8*mm))

    # Datos de entrada
    story.append(Paragraph("Datos del Proyecto", styles['LumierHeading2']))

    input_data = [
        ["Parámetro", "Valor", "Parámetro", "Valor"],
        ["Precio Compra", "1.065.000 €", "Calidad", "3★"],
        ["M² Construidos", "158 m²", "Intermediación Venta", "Sí (3%)"],
        ["M² ZZCC", "11 m²", "Precio Venta", "1.600.000 €"],
        ["Terraza", "2 m²", "Deuda", "500.000 €"],
        ["Intermed. Compra", "No", "Interés", "6,25%"],
    ]

    input_table = Table(input_data, colWidths=[40*mm, 35*mm, 45*mm, 35*mm])
    input_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_BLACK),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(input_table)
    story.append(Spacer(1, 8*mm))

    # Resumen de cálculo
    story.append(Paragraph("Resumen del Cálculo", styles['LumierHeading2']))

    calc_data = [
        ["Concepto", "Importe"],
        ["Total Adquisición", "1.087.830,00 €"],
        ["Hard Costs", "194.855,40 €"],
        ["Soft Costs", "19.065,00 €"],
        ["Intereses", "15.625,00 €"],
        ["INVERSIÓN TOTAL", "1.317.375,40 €"],
        ["", ""],
        ["Precio Venta", "1.600.000,00 €"],
        ["- Honorarios Venta", "- 58.080,00 €"],
        ["VENTA NETA", "1.541.920,00 €"],
        ["", ""],
        ["BENEFICIO NETO", "224.544,60 €"],
    ]

    calc_table = Table(calc_data, colWidths=[80*mm, 50*mm])
    calc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LUMIER_BLACK),
        ('TEXTCOLOR', (0, 0), (-1, 0), LUMIER_GOLD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, LUMIER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        # Destacar totales
        ('BACKGROUND', (0, 5), (-1, 5), LUMIER_GOLD_LIGHT),
        ('FONTNAME', (0, 5), (-1, 5), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 9), (-1, 9), HexColor('#dbeafe')),
        ('FONTNAME', (0, 9), (-1, 9), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 11), (-1, 11), LUMIER_GREEN),
        ('TEXTCOLOR', (0, 11), (-1, 11), white),
        ('FONTNAME', (0, 11), (-1, 11), 'Helvetica-Bold'),
    ]))
    story.append(calc_table)
    story.append(Spacer(1, 8*mm))

    # Métricas finales
    story.append(Paragraph("Métricas de Rentabilidad", styles['LumierHeading2']))

    final_metrics = [
        ["ROI", "17,04%", "Margen", "14,03%", "TIR", "31,56%"],
    ]

    fm_table = Table(final_metrics, colWidths=[25*mm, 25*mm, 25*mm, 25*mm, 25*mm, 25*mm])
    fm_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), LUMIER_BLUE),
        ('BACKGROUND', (1, 0), (1, 0), HexColor('#dbeafe')),
        ('BACKGROUND', (2, 0), (2, 0), LUMIER_YELLOW),
        ('BACKGROUND', (3, 0), (3, 0), LUMIER_GOLD_LIGHT),
        ('BACKGROUND', (4, 0), (4, 0), LUMIER_GREEN),
        ('BACKGROUND', (5, 0), (5, 0), HexColor('#dcfce7')),
        ('TEXTCOLOR', (0, 0), (0, 0), white),
        ('TEXTCOLOR', (4, 0), (4, 0), white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(fm_table)
    story.append(Spacer(1, 8*mm))

    # Clasificación final
    story.append(Paragraph(
        "📊 Clasificación: AJUSTADO (Margen entre 13% y 16%)",
        styles['LumierHeading3']
    ))
    story.append(Paragraph(
        "Recomendación: Revisar costes o negociar precio de compra/venta para mejorar el margen.",
        styles['LumierBody']
    ))

    # Construir PDF
    doc.build(story, onFirstPage=first_page, onLaterPages=header_footer)
    print("✅ PDF generado: MANUAL_CALCULOS_VISUAL.pdf")

if __name__ == "__main__":
    build_pdf()
