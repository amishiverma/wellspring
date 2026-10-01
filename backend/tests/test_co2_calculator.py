import pytest
from backend.engine.co2_calculator import calculate_environmental_kpis

def test_calculate_environmental_kpis():
    # 1. Mock Data
    mock_nodes = [
        {"id": "source1", "type": "source", "arrival_rate": 100, "energy_kwh_per_ton": 0},
        {"id": "mrf1", "type": "sorting", "energy_kwh_per_ton": 5.0},
        {"id": "landfill1", "type": "disposal", "energy_kwh_per_ton": 2.0}
    ]
    
    mock_edges = [
        {
            "id": "route1", 
            "distance_km": 10.0, 
            "num_trucks": 5, 
            "trips_per_hour": 2.0, 
            "fuel_liters_per_km": 0.3
        }
    ]
    
    # Mock flow dictionary (simulating output from Tanishq's graph analyzer)
    mock_flow = {
        "source1": 100, # 100 tons generated
        "mrf1": 60,     # 60 tons sent to recycling/sorting
        "landfill1": 40 # 40 tons sent to landfill
    }

    # 2. Execute
    results = calculate_environmental_kpis(nodes=mock_nodes, edges=mock_edges, flow_dict=mock_flow)

    # 3. Assertions
    assert "total_co2_kg_per_hour" in results
    assert "total_fuel_liters_per_hour" in results
    assert "landfill_diversion_rate" in results
    
    # Fuel calculation: 10km * 5 trucks * 2 trips * 0.3 liters/km = 30 liters
    assert results["total_fuel_liters_per_hour"] == 30.0
    
    # Diversion rate: 60 sorted / 100 total = 60.0% (returned as percentage, not ratio)
    assert results["landfill_diversion_rate"] == 60.0
    
    print("✅ CO2 Calculator math is verified!")