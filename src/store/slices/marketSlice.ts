import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// TODO: remplacer par le vrai marketApi quand le backend est prêt
import { mockMarketApi as marketApi } from '../../mocks/brvm-data'
import type { MarketOverview, MarketStock } from '../../types'

interface MarketState {
  overview: MarketOverview | null
  gainers: MarketStock[]
  losers: MarketStock[]
  mostActive: MarketStock[]
  loading: boolean
  error: string | null
}

const initialState: MarketState = {
  overview: null,
  gainers: [],
  losers: [],
  mostActive: [],
  loading: false,
  error: null,
}

export const fetchMarketOverview = createAsyncThunk(
  'market/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await marketApi.overview()
    } catch {
      return rejectWithValue('Impossible de charger les données du marché')
    }
  }
)

export const fetchMovers = createAsyncThunk(
  'market/fetchMovers',
  async (_, { rejectWithValue }) => {
    try {
      const [gainers, losers, mostActive] = await Promise.all([
        marketApi.movers('gainers', 5),
        marketApi.movers('losers', 5),
        marketApi.mostActive(5),
      ])
      return { gainers, losers, mostActive }
    } catch {
      return rejectWithValue('Impossible de charger les movers')
    }
  }
)

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMarketOverview.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(fetchMarketOverview.fulfilled, (state, action) => {
      state.loading = false
      state.overview = action.payload
    })
    builder.addCase(fetchMarketOverview.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string
    })
    builder.addCase(fetchMovers.fulfilled, (state, action) => {
      state.gainers = action.payload.gainers
      state.losers = action.payload.losers
      state.mostActive = action.payload.mostActive
    })
  },
})

export default marketSlice.reducer
