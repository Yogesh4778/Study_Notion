export const formattedDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
        month: "long",
        day: "numeric",
        year: "numeric",
    })
}