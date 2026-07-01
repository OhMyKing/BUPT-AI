export const reportStyles = `
    .report-container {
        max-width: 800px;
        margin: 0 auto;
        font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
        line-height: 1.6;
        color: #333;
    }
    
    .report-container h1 {
        text-align: center;
        color: #1a1a1a;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #eaeaea;
        font-size: 1.5rem;
        font-weight: 600;
    }
    
    .report-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 8px;
    }
    
    .report-section h2 {
        color: #2c5282;
        margin-bottom: 1rem;
        font-size: 1.25rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    
    .info-item {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
    }
    
    .label {
        color: #666;
        font-weight: 500;
        min-width: 4rem;
    }
    
    .value {
        color: #1a1a1a;
    }
    
    .record-item {
        background: white;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .record-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #eaeaea;
    }
    
    .time {
        color: #666;
    }
    
    .highlight {
        color: #2c5282;
        font-weight: 600;
    }
    
    @media print {
        body {
            margin: 1cm;
        }
        
        .report-section {
            break-inside: avoid;
            background: #fff;
            border: 1px solid #eaeaea;
        }
        
        .record-item {
            box-shadow: none;
            border: 1px solid #eaeaea;
        }
    }
`;