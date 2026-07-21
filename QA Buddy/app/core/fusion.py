def reciprocal_rank_fusion(dense_results, sparse_results, k=60):
    """
    Reciprocal Rank Fusion (RRF) algorithm.
    dense_results: list of Qdrant ScoredPoint from dense search
    sparse_results: list of Qdrant ScoredPoint from sparse search
    k: constant parameter for RRF (default 60)
    """
    scores = {}
    payloads = {}
    
    # Process dense search rankings
    for rank, point in enumerate(dense_results):
        point_id = point.id
        payloads[point_id] = point.payload
        scores[point_id] = scores.get(point_id, 0.0) + (1.0 / (k + rank + 1))
        
    # Process sparse search rankings
    for rank, point in enumerate(sparse_results):
        point_id = point.id
        payloads[point_id] = point.payload
        scores[point_id] = scores.get(point_id, 0.0) + (1.0 / (k + rank + 1))
        
    # Sort points based on fused RRF scores
    sorted_ids = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    
    fused_results = []
    for point_id, score in sorted_ids:
        fused_results.append({
            "id": point_id,
            "score": score,
            "payload": payloads[point_id]
        })
        
    return fused_results
