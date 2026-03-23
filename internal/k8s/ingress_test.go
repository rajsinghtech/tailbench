package k8s

import (
	"context"
	"testing"

	networkingv1 "k8s.io/api/networking/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
)

func TestDiscoverIngressFQDN(t *testing.T) {
	cs := fake.NewSimpleClientset(
		&networkingv1.Ingress{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "bench-echo-ingress",
				Namespace: Namespace,
				Labels:    map[string]string{"app.kubernetes.io/part-of": "tailbench-l7"},
			},
			Status: networkingv1.IngressStatus{
				LoadBalancer: networkingv1.IngressLoadBalancerStatus{
					Ingress: []networkingv1.IngressLoadBalancerIngress{
						{Hostname: "bench-echo-ingress.tailnet.ts.net"},
					},
				},
			},
		},
	)
	fqdn, err := DiscoverIngressFQDN(context.Background(), cs, "app.kubernetes.io/part-of=tailbench-l7")
	if err != nil {
		t.Fatal(err)
	}
	if fqdn != "bench-echo-ingress.tailnet.ts.net" {
		t.Errorf("got %q, want bench-echo-ingress.tailnet.ts.net", fqdn)
	}
}

func TestDiscoverServiceLBFQDN(t *testing.T) {
	cs := fake.NewSimpleClientset(
		&corev1.Service{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "bench-echo-lb",
				Namespace: Namespace,
				Labels:    map[string]string{"app.kubernetes.io/part-of": "tailbench-l7"},
			},
			Spec: corev1.ServiceSpec{Type: corev1.ServiceTypeLoadBalancer},
			Status: corev1.ServiceStatus{
				LoadBalancer: corev1.LoadBalancerStatus{
					Ingress: []corev1.LoadBalancerIngress{
						{Hostname: "bench-echo-lb.tailnet.ts.net"},
					},
				},
			},
		},
	)
	fqdn, err := DiscoverServiceLBFQDN(context.Background(), cs, "app.kubernetes.io/part-of=tailbench-l7")
	if err != nil {
		t.Fatal(err)
	}
	if fqdn != "bench-echo-lb.tailnet.ts.net" {
		t.Errorf("got %q, want bench-echo-lb.tailnet.ts.net", fqdn)
	}
}

func TestDiscoverNoResources(t *testing.T) {
	cs := fake.NewSimpleClientset()
	_, err := DiscoverIngressFQDN(context.Background(), cs, "app.kubernetes.io/part-of=tailbench-l7")
	if err == nil {
		t.Error("expected error when no Ingress found")
	}
}
