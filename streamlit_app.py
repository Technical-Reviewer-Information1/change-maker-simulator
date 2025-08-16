import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import random

st.set_page_config(page_title="釣り銭シミュレーション", layout="wide")

st.title("釣り銭のシミュレーション")
st.caption("Created by Dit-Lab.(Daiki ITO)")
st.caption("Supported by Tomoaki ATSUMI")

# シミュレーションの説明
st.header("シミュレーションについて")
st.markdown("""
このシミュレーションでは、300円の商品に対する釣り銭の管理を学習できます。
顧客の支払い方法は乱数によって決定され、お店の釣り銭の枚数変動を可視化します。

### シミュレーションの基本ルール

**顧客の支払い方法（乱数生成）:**
- **パターンa**: 100円玉3枚で支払い（乱数範囲: 0以上0.5未満）
- **パターンb**: 500円玉1枚で支払い（乱数範囲: 0.5以上0.8未満）  
- **パターンc**: 1000円玉1枚で支払い（乱数範囲: 0.8以上1未満）

**釣り銭の計算:**
- **パターンa**: 釣り銭なし
- **パターンb**: 200円の釣り銭 → 100円玉2枚
- **パターンc**: 700円の釣り銭 → 500円玉1枚＋100円玉2枚 または 100円玉7枚（乱数で決定）

**釣り銭の枚数管理:**
- 釣り銭が減る場合は正の数で記録
- 釣り銭が足りない場合は負の数で記録
""")

# パラメータ設定
st.header("シミュレーションパラメータ")

col1, col2, col3 = st.columns(3)

with col1:
    num_customers = st.number_input("顧客数", min_value=1, max_value=1000, value=100, step=1)
    
with col2:
    initial_100_coins = st.number_input("初期100円玉枚数", min_value=0, max_value=100, value=10, step=1)
    
with col3:
    initial_500_coins = st.number_input("初期500円玉枚数", min_value=0, max_value=50, value=10, step=1)

# シミュレーション実行ボタン
if st.button("シミュレーション実行", type="primary"):
    
    # 初期設定
    coins_100 = initial_100_coins
    coins_500 = initial_500_coins
    
    # 結果記録用のリスト
    results = []
    coins_100_history = [coins_100]
    coins_500_history = [coins_500]
    customer_numbers = [0]
    
    # シミュレーション実行
    for customer in range(1, num_customers + 1):
        # 乱数生成
        random_value = random.random()
        
        if random_value < 0.5:
            # パターンa: 100円玉3枚
            pattern = "a"
            payment = "100円玉3枚"
            change_100 = 3  # 100円玉が3枚増える
            change_500 = 0
            change_amount = 0
        elif random_value < 0.8:
            # パターンb: 500円玉1枚
            pattern = "b"
            payment = "500円玉1枚"
            change_100 = -2  # 100円玉が2枚減る
            change_500 = 1   # 500円玉が1枚増える
            change_amount = 200
        else:
            # パターンc: 1000円玉1枚
            pattern = "c"
            payment = "1000円玉1枚"
            change_amount = 700
            
            # 釣り銭の支払い方法を乱数で決定
            if coins_500 > 0 and coins_100 >= 2:
                # 500円玉1枚 + 100円玉2枚で支払い可能な場合
                change_method_random = random.random()
                if change_method_random < 0.5:
                    change_100 = -2
                    change_500 = -1
                else:
                    change_100 = -7
                    change_500 = 0
            else:
                # 100円玉7枚で支払い
                change_100 = -7
                change_500 = 0
        
        # 枚数更新
        coins_100 += change_100
        coins_500 += change_500
        
        # 結果記録
        results.append({
            "顧客": customer,
            "乱数値": round(random_value, 3),
            "パターン": pattern,
            "支払い方法": payment,
            "釣り銭額": change_amount,
            "100円玉変化": change_100,
            "500円玉変化": change_500,
            "100円玉残数": coins_100,
            "500円玉残数": coins_500
        })
        
        # 履歴記録
        coins_100_history.append(coins_100)
        coins_500_history.append(coins_500)
        customer_numbers.append(customer)
    
    # 結果表示
    st.header("シミュレーション結果")
    
    # 結果テーブル
    df_results = pd.DataFrame(results)
    st.subheader("詳細結果テーブル")
    st.dataframe(df_results, use_container_width=True)
    
    # グラフ表示
    st.subheader("釣り銭枚数の変化")
    
    # Plotlyグラフ作成
    fig = go.Figure()
    
    # 100円玉の変化
    fig.add_trace(go.Scatter(
        x=customer_numbers,
        y=coins_100_history,
        mode='lines+markers',
        name='100円玉',
        line=dict(color='blue', width=2),
        marker=dict(size=4)
    ))
    
    # 500円玉の変化
    fig.add_trace(go.Scatter(
        x=customer_numbers,
        y=coins_500_history,
        mode='lines+markers',
        name='500円玉',
        line=dict(color='red', width=2),
        marker=dict(size=4)
    ))
    
    # ゼロライン追加
    fig.add_hline(y=0, line_dash="dash", line_color="gray", opacity=0.5)
    
    # レイアウト設定
    fig.update_layout(
        title="釣り銭枚数の推移",
        xaxis_title="顧客数",
        yaxis_title="枚数",
        hovermode='x unified',
        template="plotly_white",
        width=800,
        height=500
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # 統計情報
    st.subheader("統計情報")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("最終100円玉枚数", coins_100_history[-1], coins_100_history[-1] - initial_100_coins)
    
    with col2:
        st.metric("最終500円玉枚数", coins_500_history[-1], coins_500_history[-1] - initial_500_coins)
    
    with col3:
        pattern_counts = df_results['パターン'].value_counts()
        st.write("**支払いパターン分布**")
        for pattern, count in pattern_counts.items():
            st.write(f"パターン{pattern}: {count}回 ({count/num_customers*100:.1f}%)")
    
    with col4:
        negative_100 = (df_results['100円玉残数'] < 0).sum()
        negative_500 = (df_results['500円玉残数'] < 0).sum()
        st.write("**不足発生回数**")
        st.write(f"100円玉不足: {negative_100}回")
        st.write(f"500円玉不足: {negative_500}回")

else:
    st.info("👆 パラメータを設定してシミュレーションを実行してください")
