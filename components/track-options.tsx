// Track options
export const trackOptions = [
    { value: "bounty-obelisk-foothills-dawn", label: "Dawn" },
    { value: "bounty-obelisk-foothills-dawnreverse", label: "Dawn Reverse" },
    { value: "bounty-obelisk-foothills-manta", label: "Manta" },
    { value: "bounty-obelisk-foothills-mantareverse", label: "Manta Reverse" },
    { value: "bounty-obelisk-foothills-rockbound", label: "Rockbound" },
    { value: "bounty-obelisk-foothills-rockboundreverse", label: "Rockbound Reverse" },
    { value: "bounty-obelisk-foothills-scythe", label: "Scythe" },
    { value: "bounty-obelisk-foothills-scythereverse", label: "Scythe Reverse" },
    { value: "bounty-obelisk-foothills-sickle", label: "Sickle" },
    { value: "bounty-obelisk-foothills-sicklereverse", label: "Sickle Reverse" },
    { value: "bounty-obelisk-foothills-sunrise", label: "Sunrise" },
    { value: "bounty-obelisk-foothills-sunrisereverse", label: "Sunrise Reverse" },
    { value: "bounty-obelisk-vipersgorge-boa", label: "Boa" },
    { value: "bounty-obelisk-vipersgorge-boareverse", label: "Boa Reverse" },
    { value: "bounty-obelisk-vipersgorge-dragoon", label: "Dragoon" },
    { value: "bounty-obelisk-vipersgorge-dragoonreverse", label: "Dragoon Reverse" },
    { value: "bounty-obelisk-vipersgorge-fang", label: "Fang" },
    { value: "bounty-obelisk-vipersgorge-fangreverse", label: "Fang Reverse" },
    { value: "bounty-obelisk-vipersgorge-slither", label: "Slither" },
    { value: "bounty-obelisk-vipersgorge-slitherreverse", label: "Slither Reverse" },
]

// Update the Stage 3 time range to March 14th to May 19th, 2025
export const timeRangeOptions = [
    { value: "stage3", label: "Stage 3", startDate: "2025-03-14T00:00:00.000Z", endDate: "2025-05-19T23:59:59.999Z" },
    { value: "stage2", label: "Stage 2", startDate: "2025-01-01T00:00:00.000Z", endDate: "2025-03-13T16:59:59.999Z" },
    { value: "all", label: "All Time", startDate: "2024-01-01T00:00:00.000Z", endDate: new Date().toISOString() },
    {
        value: "today",
        label: "Today",
        get startDate() {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return today.toISOString()
        },
        get endDate() {
            return new Date().toISOString()
        },
    },
    {
        value: "week",
        label: "This Week",
        get startDate() {
            return getStartOfWeek().toISOString()
        },
        get endDate() {
            return new Date().toISOString()
        },
    },
    {
        value: "month",
        label: "This Month",
        get startDate() {
            return getStartOfMonth().toISOString()
        },
        get endDate() {
            return new Date().toISOString()
        },
    },
    { value: "custom", label: "Custom Range", startDate: "", endDate: "" },
]

// Region options
export const regionOptions = [
    { value: "all", label: "All Regions" },
    { value: "2", label: "Europe" },
    { value: "10", label: "Hong Kong" },
    { value: "4", label: "LATAM" },
    { value: "1", label: "NA East" },
    { value: "9", label: "NA West" },
    { value: "7", label: "Singapore" },
]

// Helper functions for date calculations
function getStartOfWeek() {
    // Get current date in UTC
    const now = new Date()

    // Clone the date for calculations
    const currentDate = new Date(now)

    // Find the most recent Sunday
    const dayOfWeek = currentDate.getUTCDay() // 0 = Sunday, 1 = Monday, etc.

    // Calculate days to subtract to get to the previous Sunday
    // If today is Sunday, we need to check if it's before or after 11:59 PM UTC
    let daysToSubtract = dayOfWeek

    // If it's Sunday but before 11:59 PM UTC, we need to use the previous Sunday
    if (dayOfWeek === 0) {
        const hours = currentDate.getUTCHours()
        const minutes = currentDate.getUTCMinutes()

        // If it's before 23:59 (11:59 PM) UTC, use the previous week's Sunday
        if (hours < 23 || (hours === 23 && minutes < 59)) {
            daysToSubtract = 7 // Go back to previous Sunday
        }
    }

    // Calculate the start date (previous Sunday)
    const startDate = new Date(currentDate)
    startDate.setUTCDate(currentDate.getUTCDate() - daysToSubtract)

    // Set the time to 23:59:00 UTC (11:59 PM)
    startDate.setUTCHours(23, 59, 0, 0)

    return startDate
}

function getStartOfMonth() {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
}

