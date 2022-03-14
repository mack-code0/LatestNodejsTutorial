const deleteProduct = (btn)=>{
    const csrf = btn.parentElement.querySelector("[name=_csrf]").value
    const prodId = btn.parentElement.querySelector("[name=productId").value
    console.log(csrf, prodId);
    fetch("/admin/product/"+prodId, {
        method: "DELETE",
        headers: {
            "csrf-token": csrf
        }
    }).then(res=>{
        console.log(res);

        btn.closest("article").remove()
    }).catch(err=>{
        console.log(err);
    })
}

const deleteCart = (btn)=>{
    const csrf = btn.parentElement.querySelector("[name=_csrf]").value
    const prodId = btn.parentElement.querySelector("[name=productId]").value

    fetch("/cart/"+prodId, {
        method: "DELETE",
        headers: {
            "csrf-token": csrf
        }
    }).then(res=>{
        btn.closest("li").remove()
    }).catch(err => {
        console.log(err);
    })
}